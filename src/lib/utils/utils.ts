/**
 * Truncate a string to a certain length
 *
 * @param str - The string to truncate
 * @param max - The max length of the string
 * @returns The truncated string minus the last 3 characters
 */
export function truncate(str: string, max: number) {
	return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}
