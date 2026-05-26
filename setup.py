from setuptools import setup, find_packages

setup(
    name="pilotcore",
    version="1.0.0",
    description="PilotCore — the execution kernel for the PilotMaster AI observability ecosystem",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "fastapi",
        "groq",
        "sentence-transformers",
        "faiss-cpu",
        "numpy",
        "pydantic",
        "python-dotenv",
        "requests",
    ],
)
