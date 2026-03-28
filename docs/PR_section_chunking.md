# PR: Section-Based Chunking + Amendment Detection

**Branch:** `feature/section-chunking-amendment-detection`
**Author:** Sandra Gao (domain lead)

## What this PR does

Replaces the original fixed-token PDF chunker with protocol-structure-aware ingestion:

1. **Section-based chunking** — splits on regulatory headers, not fixed token windows
2. **Amendment detection** — groups PDF versions, extracts AMENDMENTS AND UPDATES as amendment_rationale chunks
3. **Voyage AI embeddings** (preferred over OpenAI) for scientific text

See full details in docs/PR_section_chunking.md