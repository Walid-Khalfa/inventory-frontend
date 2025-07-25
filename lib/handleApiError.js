import { AxiosError } from "axios";

/**
 * Extracts a user-friendly error message from an Axios error object,
 * with special handling for Strapi validation errors.
 *
 * @param {any} error The error object, expected to be an AxiosError.
 * @returns {string} A formatted, user-friendly error message.
 */
export function handleApiError(error) {
  if (error instanceof AxiosError && error.response) {
    const strapiError = error.response.data?.error;

    // Handle Strapi validation errors (HTTP 400)
    if (strapiError?.name === "ValidationError" && strapiError.details?.errors) {
      const errorDetails = strapiError.details.errors
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");
      return `${strapiError.message}:\n${errorDetails}`;
    }

    // Handle other Strapi-formatted errors
    if (strapiError?.message) {
      return `Error: ${strapiError.message} (Status: ${strapiError.status})`;
    }

    // Handle non-Strapi errors with a response
    return `Request failed with status code ${error.response.status}`;
  }

  // Fallback for network errors or other issues without a response
  if (error.message) {
    return error.message;
  }

  return "An unknown error occurred. Please check the console for details.";
}