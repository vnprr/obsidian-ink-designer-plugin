const POLISH_MAP: Record<string, string> = {
	"ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
	"ó": "o", "ś": "s", "ź": "z", "ż": "z",
	"Ą": "a", "Ć": "c", "Ę": "e", "Ł": "l", "Ń": "n",
	"Ó": "o", "Ś": "s", "Ź": "z", "Ż": "z",
};

export function slugify(input: string): string {
	let result = input.toLowerCase();

	// Replace Polish diacritics
	result = result.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_MAP[ch] ?? ch);

	// Replace any non-alphanumeric with underscore
	result = result.replace(/[^a-z0-9]/g, "_");

	// Collapse multiple underscores
	result = result.replace(/_+/g, "_");

	// Trim leading/trailing underscores
	result = result.replace(/^_|_$/g, "");

	// Ensure it doesn't start with a digit
	if (/^[0-9]/.test(result)) {
		result = "_" + result;
	}

	return result;
}
