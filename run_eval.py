"""DocPilot benchmark runner.

Performs a full automated workflow:
1) Authenticate with DocPilot (same mechanism as frontend)
2) Upload a benchmark PDF
3) Wait for ingestion to appear in the documents list
4) Load benchmark queries from JSON
5) Ask all questions
6) Store responses (optionally) and print a summary

Logs:
  [LOGIN]
  [UPLOAD]
  [INGESTION]
  [QUERY]
  [SUMMARY]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class BenchmarkResult:
    query: str
    ok: bool
    status_code: int | None = None
    answer: str | None = None
    sources: Any | None = None
    trace_id: str | None = None
    error: str | None = None

    retrieval_quality: str | None = None
    grounded: bool | None = None
    retrieval_score_avg: float | None = None
    latency: float | None = None
    chunk_count: int | None = None


def login(
    session: requests.Session, base_url: str, username: str, password: str
) -> str:
    """Authenticate exactly like the frontend's loginRequest().

    Frontend uses:
      POST {API_BASE}/auth/login
      Content-Type: application/x-www-form-urlencoded
      body fields: username, password

    And frontend expects response JSON fields:
      access_token, token_type

    This function returns the access_token string.
    """

    login_url = f"{base_url}/docpilot/auth/login"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    form_data = {
        "username": username,
        "password": password,
    }

    resp = session.post(login_url, data=form_data, headers=headers, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(f"login failed: {resp.status_code} {resp.text}")

    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"login succeeded but token missing: {data}")

    return token


def upload_document(
    session: requests.Session, base_url: str, pdf_path: str
) -> dict[str, Any]:
    """Upload benchmark PDF exactly like the frontend uploadFile() does."""

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(pdf_path)

    upload_url = f"{base_url}/docpilot/docs/upload"

    with open(pdf_path, "rb") as f:
        files = {
            # Frontend uses: formData.append('file', file)
            "file": (os.path.basename(pdf_path), f, "application/pdf"),
        }
        resp = session.post(upload_url, files=files, timeout=300)

    # Upload failures must stop execution immediately.
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"upload failed: {resp.status_code} {resp.text}")

    return resp.json()


def wait_for_ingestion(
    session: requests.Session,
    base_url: str,
    poll_seconds: float = 2.0,
    timeout_seconds: float = 180.0,
) -> None:
    """Wait until ingestion appears.

    The backend currently has no explicit "ingestion complete" endpoint.
    We poll /docpilot/docs/ and wait until at least one document exists.

    Note: uploading already triggers process_document() server-side.
    This wait is a safety buffer for async downstream indexing.
    """

    docs_url = f"{base_url}/docpilot/docs/"
    deadline = time.time() + timeout_seconds

    last_exc: Exception | None = None

    while time.time() < deadline:
        try:
            resp = session.get(docs_url, timeout=60)
            if resp.status_code == 200:
                docs = resp.json() or []
                if len(docs) > 0:
                    time.sleep(2.0)
                    return
        except Exception as e:
            last_exc = e

        time.sleep(poll_seconds)

    raise TimeoutError(f"ingestion wait timed out: {last_exc}")


def get_trace(base_url: str, trace_id: str) -> dict:

    try:
        resp = requests.get(
            f"{base_url}/tracepilot/traces/{trace_id}",
            timeout=30,
        )

        if resp.status_code != 200:
            return {}

        return resp.json()

    except Exception as e:
        print(f"[TRACE FETCH ERROR] {e}")
        return {}


def run_benchmark(
    session: requests.Session, base_url: str, benchmark_file: str
) -> list[BenchmarkResult]:
    with open(benchmark_file, "r", encoding="utf-8") as f:
        benchmark = json.load(f)

    results: list[BenchmarkResult] = []

    for item in benchmark:
        query = item.get("query") or item.get("question")
        if not query:
            continue

        print("\n" + "=" * 80)
        print(query)
        print("=" * 80)
        print("[QUERY]", flush=True)

        payload = {
            "question": query,
            # session_id/source/model_name can be omitted.
        }

        try:
            resp = session.post(
                f"{base_url}/docpilot/chat/ask", json=payload, timeout=240
            )

            if resp.status_code != 200:
                results.append(
                    BenchmarkResult(
                        query=query,
                        ok=False,
                        status_code=resp.status_code,
                        error=resp.text,
                    )
                )
                print(f"[QUERY] failed (status={resp.status_code})", flush=True)
                continue

            data = resp.json() if resp.content else {}
            print("\nANSWER:")
            print(data.get("answer"))
            print()
            trace_id = data.get("trace_id")

            trace_data = {}

            if trace_id:
                trace_data = get_trace(base_url, trace_id)
                print(
                    f"[TRACE] quality={trace_data.get('retrieval_quality')} "
                    f"grounded={trace_data.get('grounded')} "
                    f"score={trace_data.get('retrieval_score_avg')}"
                )
            results.append(
                BenchmarkResult(
                    query=query,
                    ok=True,
                    status_code=resp.status_code,
                    answer=data.get("answer"),
                    sources=data.get("sources"),
                    trace_id=trace_id,
                    retrieval_quality=trace_data.get("retrieval_quality"),
                    grounded=trace_data.get("grounded"),
                    retrieval_score_avg=trace_data.get("retrieval_score_avg"),
                    latency=trace_data.get("latency"),
                    chunk_count=trace_data.get("chunk_count"),
                )
            )
            print("[QUERY] ok", flush=True)

        except Exception as e:
            results.append(BenchmarkResult(query=query, ok=False, error=str(e)))
            print("[QUERY] exception:", e, flush=True)
            continue

    return results


def print_summary(results: list[BenchmarkResult]) -> None:
    total = len(results)
    passed = sum(1 for r in results if r.ok)
    failed = total - passed

    print("\n[SUMMARY]")
    print(f"Total queries: {total}")
    print(f"Succeeded:     {passed}")
    print(f"Failed:        {failed}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url", default=os.getenv("DOCPILOT_URL", "http://localhost:8000")
    )
    parser.add_argument(
        "--benchmark-file", default=os.getenv("BENCHMARK_FILE", "benchmarks/bert.json")
    )
    parser.add_argument(
        "--pdf-path", default=os.getenv("BENCHMARK_PDF"), help="PDF to upload"
    )

    parser.add_argument("--username", default=os.getenv("DOCPILOT_USERNAME"))
    parser.add_argument("--password", default=os.getenv("DOCPILOT_PASSWORD"))

    parser.add_argument("--ingestion-timeout", type=float, default=180.0)
    parser.add_argument(
        "--output",
        default="benchmark_results.json",
        help="Write results JSON to this path",
    )

    args = parser.parse_args()

    if not args.username or not args.password:
        print("Missing auth credentials.")
        print(
            "Provide --username/--password or DOCPILOT_USERNAME/DOCPILOT_PASSWORD env vars."
        )
        return 2

    if not args.pdf_path:
        # Default convention: benchmarks/<name>.json -> benchmarks/<name>.pdf
        stem = os.path.splitext(os.path.basename(args.benchmark_file))[0]
        args.pdf_path = os.path.join(
            os.path.dirname(args.benchmark_file), f"{stem}.pdf"
        )

    session = requests.Session()

    try:
        print("[LOGIN]", flush=True)
        token = login(session, args.base_url, args.username, args.password)
        # Frontend uses Authorization header Bearer token.
        session.headers.update({"Authorization": f"Bearer {token}"})
        resp = session.get(
            f"{args.base_url}/docpilot/auth/me",
            timeout=30,
        )

        print("[AUTH CHECK]")
        print(resp.status_code)
        print(resp.text)
        """  print("[UPLOAD]", flush=True)
        upload_document(session, args.base_url, args.pdf_path)

        print("[INGESTION]", flush=True)
        wait_for_ingestion(
            session,
            args.base_url,
            timeout_seconds=args.ingestion_timeout,
        )  """

        print("[QUERY]", flush=True)
        results = run_benchmark(session, args.base_url, args.benchmark_file)

        print_summary(results)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(
                    [r.__dict__ for r in results], f, ensure_ascii=False, indent=2
                )

        return 0

    except Exception as e:
        # If authentication fails, stop immediately.
        # If upload fails, stop immediately.
        print("ERROR:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
