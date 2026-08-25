import re
from typing import List, Dict, Any, Optional, Tuple
from pilotcore.chunking.base import BaseChunker
from pilotcore.chunking.recursive import RecursiveCharacterChunker


# Comprehensive catalog of semantic section categories
SEMANTIC_SECTIONS: List[Tuple[str, re.Pattern]] = [
    # Resumes & CVs
    ("experience", re.compile(r"^(?:work\s+|professional\s+|relevant\s+|industry\s+)?experience|employment(?:\s+history)?|work\s+history|career\s+history", re.IGNORECASE)),
    ("education", re.compile(r"^education(?:al\s+background)?|academic(?:\s+background|\s+qualifications)?|qualifications|degrees", re.IGNORECASE)),
    ("projects", re.compile(r"^(?:featured\s+|key\s+|technical\s+|academic\s+|personal\s+)?projects", re.IGNORECASE)),
    ("skills", re.compile(r"^(?:technical\s+|core\s+|key\s+)?skills|skills\s*&?\s*(?:expertise|competencies|tools)|technical\s+expertise|technologies", re.IGNORECASE)),
    ("certifications", re.compile(r"^certifications?|licenses(?:\s*&?\s*certifications?)?|courses|accreditations", re.IGNORECASE)),
    ("achievements", re.compile(r"^achievements?|awards(?:\s*&?\s*honors)?|honors|accomplishments", re.IGNORECASE)),
    ("publications", re.compile(r"^publications?|research(?:\s+papers?)?|patents", re.IGNORECASE)),
    ("leadership", re.compile(r"^positions?\s+of\s+responsibility|leadership(?:\s+experience)?|volunteering|extracurricular(?:\s+activities)?", re.IGNORECASE)),
    ("summary", re.compile(r"^(?:executive\s+|professional\s+|career\s+)?summary|about(?:\s+me)?|profile|objective", re.IGNORECASE)),
    ("contact", re.compile(r"^contact(?:\s+info(?:rmation)?)?|personal\s+details|portfolio", re.IGNORECASE)),

    # Technical Reports, Papers & Documentation
    ("abstract", re.compile(r"^abstract", re.IGNORECASE)),
    ("introduction", re.compile(r"^introduction|overview|background(?:\s+and\s+motivation)?", re.IGNORECASE)),
    ("architecture", re.compile(r"^(?:system\s+)?architecture|system\s+design|framework\s+overview|architectural\s+overview", re.IGNORECASE)),
    ("methodology", re.compile(r"^methodology|methods|proposed\s+(?:method|approach|system)|experimental\s+setup", re.IGNORECASE)),
    ("implementation", re.compile(r"^implementation(?:\s+details)?|technical\s+implementation|pipeline\s+design", re.IGNORECASE)),
    ("experiments", re.compile(r"^experiments|benchmarks?|evaluations?|performance\s+analysis", re.IGNORECASE)),
    ("results", re.compile(r"^results(?:\s+and\s+discussion)?|findings|key\s+metrics", re.IGNORECASE)),
    ("discussion", re.compile(r"^discussion|analysis|tradeoffs|limitations", re.IGNORECASE)),
    ("related_work", re.compile(r"^related\s+work|literature\s+review|prior\s+art", re.IGNORECASE)),
    ("conclusion", re.compile(r"^conclusion(?:\s+and\s+future\s+work)?|summary\s+and\s+conclusions?|future\s+work", re.IGNORECASE)),
    ("references", re.compile(r"^references|bibliography", re.IGNORECASE)),
    ("appendix", re.compile(r"^appendix(?:\s+[A-Z0-9]+)?|supplementary\s+material", re.IGNORECASE)),

    # Business & Financial
    ("financials", re.compile(r"^(?:financial\s+performance|revenue(?:\s+breakdown)?|q[1-4]\s+(?:financials|results|performance))", re.IGNORECASE)),
    ("recommendations", re.compile(r"^(?:strategic\s+)?recommendations?|action\s+items|next\s+steps", re.IGNORECASE)),
]

# Patterns for sub-items: Bullet projects/roles (e.g. "• DevDiscuss GitHub | Live" or "OCR Engineer Sep 2023 - Aug 2024")
DATE_RANGE_PATTERN = re.compile(r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|20\d\d)\b.*?(?:present|\d{4})", re.IGNORECASE)
BULLET_SUBHEADER_PATTERN = re.compile(r"^[\s•\-\*]+([A-Za-z0-9_\-\s]+?)(?:\s+(?:GitHub|Live|Coursera|\d{4}))?$", re.MULTILINE)


class StructureAwareChunker(BaseChunker):
    """
    Intelligent Structure-Aware Chunker.
    
    Extracts semantic document hierarchies across:
    1. Markdown `#` to `######` headers & HTML `<h1>`-`<h6>` tags
    2. Resume & CV structural sections (Experience, Projects, Education, Skills, etc.)
    3. Technical paper / report structures (Abstract, Methods, Results, Conclusion, etc.)
    4. Individual subsection blocks (Projects, Roles with dates, and Companies)
    
    Generates rich contextual breadcrumb paths:
      [Section > Subsection / Role (Details)]
      {chunk_content}
    """

    MD_HEADER_PATTERN = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
    HTML_HEADER_PATTERN = re.compile(r"<h([1-6])(?:\s+[^>]*)?>(.*?)</h\1>", re.IGNORECASE)

    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 80,
        **kwargs: Any,
    ) -> List[Dict[str, Any]]:
        if not text or not text.strip():
            return []

        # 1. Parse document into structural blocks
        sections = self._parse_document_structure(text)

        if not sections:
            fallback = RecursiveCharacterChunker()
            return fallback.chunk(text, chunk_size=chunk_size, overlap=overlap)

        # 2. Process sections and sub-split oversized sections while preserving breadcrumbs
        recursive_splitter = RecursiveCharacterChunker()
        final_chunks = []

        for sec in sections:
            content = sec["content"].strip()
            if not content:
                continue

            header_path = sec["header_path"]
            header_level = sec["level"]
            section_title = sec["title"]
            section_type = sec["type"]
            subsection = sec.get("subsection")

            # Format chunk header: [Path]
            breadcrumb_header = f"[{header_path}]" if header_path else ""

            if len(content) <= chunk_size:
                formatted_text = (
                    f"{breadcrumb_header}\n\n{content}" if breadcrumb_header else content
                )
                final_chunks.append({
                    "text": formatted_text,
                    "metadata": {
                        "section_title": section_title,
                        "section_type": section_type,
                        "subsection": subsection,
                        "header_path": header_path,
                        "structure_type": sec.get("structure_type", "section"),
                        "level": header_level,
                    },
                })
            else:
                # Sub-split oversized section content
                sub_splits = recursive_splitter.chunk(
                    content,
                    chunk_size=chunk_size,
                    overlap=overlap,
                )
                for sub_idx, sub in enumerate(sub_splits):
                    sub_text = sub["text"].strip()
                    if not sub_text:
                        continue
                    part_header = (
                        f"[{header_path} - Part {sub_idx + 1}]"
                        if header_path
                        else ""
                    )
                    formatted_text = (
                        f"{part_header}\n\n{sub_text}" if part_header else sub_text
                    )
                    final_chunks.append({
                        "text": formatted_text,
                        "metadata": {
                            "section_title": section_title,
                            "section_type": section_type,
                            "subsection": subsection,
                            "header_path": header_path,
                            "structure_type": sec.get("structure_type", "section"),
                            "level": header_level,
                            "sub_chunk_index": sub_idx,
                        },
                    })

        return final_chunks

    def _parse_document_structure(self, text: str) -> List[Dict[str, Any]]:
        lines = text.splitlines(keepends=True)
        sections = []

        current_major_title: Optional[str] = None
        current_major_type: str = "general"
        current_major_level: int = 1

        current_sub_title: Optional[str] = None
        current_sub_level: int = 2

        current_lines: List[str] = []

        def flush_current_section():
            nonlocal current_lines, current_major_title, current_sub_title, current_major_type, current_major_level, current_sub_level
            if not current_lines:
                return
            content_str = "".join(current_lines).strip()
            if not content_str:
                current_lines = []
                return

            # Determine title & path
            if current_major_title and current_sub_title:
                path = f"{current_major_title} > {current_sub_title}"
                title = current_major_title
                level = current_sub_level
            elif current_major_title:
                path = current_major_title
                title = current_major_title
                level = current_major_level
            else:
                path = ""
                title = "Overview"
                level = 1

            sections.append({
                "title": title,
                "type": current_major_type,
                "subsection": current_sub_title,
                "header_path": path,
                "level": level,
                "structure_type": "semantic_section",
                "content": content_str,
            })
            current_lines = []

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                current_lines.append(line)
                continue

            # 1. Check for Markdown Header
            md_match = self.MD_HEADER_PATTERN.match(trimmed)
            if md_match:
                flush_current_section()
                level = len(md_match.group(1))
                title = md_match.group(2).strip()
                if level <= 2:
                    current_major_title = title
                    current_major_type = self._classify_title(title)
                    current_major_level = level
                    current_sub_title = None
                else:
                    current_sub_title = title
                    current_sub_level = level
                current_lines.append(line)
                continue

            # 2. Check for HTML Header
            html_match = self.HTML_HEADER_PATTERN.search(trimmed)
            if html_match:
                flush_current_section()
                level = int(html_match.group(1))
                title = re.sub(r"<[^>]+>", "", html_match.group(2)).strip()
                if level <= 2:
                    current_major_title = title
                    current_major_type = self._classify_title(title)
                    current_major_level = level
                    current_sub_title = None
                else:
                    current_sub_title = title
                    current_sub_level = level
                current_lines.append(line)
                continue

            # 3. Check for Semantic Domain Heading (Resume / Paper / Document Sections)
            sem_title, sem_type = self._detect_semantic_heading(trimmed)
            if sem_title:
                flush_current_section()
                current_major_title = sem_title
                current_major_type = sem_type
                current_major_level = 1
                current_sub_title = None
                current_lines.append(line)
                continue

            # 4. Check for Sub-item / Role / Project within major section
            if current_major_title and current_major_type in ["projects", "experience", "leadership", "education"]:
                sub_header = self._detect_sub_item(trimmed)
                if sub_header:
                    flush_current_section()
                    current_sub_title = sub_header
                    current_sub_level = 2
                    current_lines.append(line)
                    continue

            current_lines.append(line)

        flush_current_section()
        return sections

    @staticmethod
    def _detect_semantic_heading(line: str) -> Tuple[Optional[str], str]:
        """
        Detect standalone section headers like 'Experience', 'Education', 'Projects', 'Technical Skills'.
        """
        clean = line.rstrip(":").strip()
        words = clean.split()
        if not words or len(words) > 6:
            return None, "general"

        # Check against semantic catalog
        for sec_type, pattern in SEMANTIC_SECTIONS:
            if pattern.fullmatch(clean) or (len(words) <= 3 and pattern.match(clean)):
                # Return normalized Title Case
                return clean.title() if not clean.isupper() else clean.title(), sec_type

        # Check for standalone ALL-CAPS headers (e.g. 'TECHNICAL SKILLS', 'WORK EXPERIENCE')
        if len(clean) >= 3 and clean.isupper() and clean.replace(" ", "").isalpha() and len(words) <= 4:
            return clean.title(), "section"

        return None, "general"

    @staticmethod
    def _detect_sub_item(line: str) -> Optional[str]:
        """
        Detect specific project names or role headings like:
        - '• DevDiscuss GitHub | Live'
        - '• OCR Engineer Sep 2023 - Aug 2024'
        - 'Intern Feb 2022 - Mar 2022'
        - 'Heart Disease RAG Assistant'
        """
        clean = line.strip().lstrip("•-*").strip()
        if not clean or len(clean) > 80:
            return None

        # Check if line contains a role with date range: "OCR Engineer Sep 2023 - Aug 2024"
        if DATE_RANGE_PATTERN.search(clean) and len(clean.split()) <= 10:
            return clean

        # Check bullet project headers: "• DevDiscuss" or "• DevDiscuss GitHub | Live"
        if line.strip().startswith(("•", "-", "*")) and len(clean.split()) <= 8:
            # Clean off trailing links like GitHub | Live
            cleaned_name = re.sub(r"\s+(?:GitHub|Live|Demo|Link|Coursera)(?:\s*\|\s*(?:GitHub|Live|Demo|Link))?", "", clean, flags=re.IGNORECASE).strip()
            if cleaned_name and len(cleaned_name) >= 3:
                return cleaned_name

        return None

    @staticmethod
    def _classify_title(title: str) -> str:
        clean = title.lower().strip()
        for sec_type, pattern in SEMANTIC_SECTIONS:
            if pattern.search(clean):
                return sec_type
        return "general"
