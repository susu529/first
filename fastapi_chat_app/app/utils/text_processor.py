from typing import List


def split_text_into_chunks(text: str, max_chars: int = 800, overlap: int = 100) -> List[str]:
	parts: List[str] = []
	start = 0
	n = len(text)
	if n == 0:
		return parts
	while start < n:
		end = min(n, start + max_chars)
		parts.append(text[start:end])
		if end == n:
			break
		start = max(0, end - overlap)
	return parts


