const { HfInference } = require("@huggingface/inference");

/**
 * Local content moderation using Hugging Face's inference API
 * Handles text classification for hate speech detection
 */
class LocalModeration {
  // Private static HuggingFace inference client
  static #hf = new HfInference(process.env.HF_TOKEN);

  /**
   * Checks text for hate speech using pre-trained model
   * Returns true if content is safe, false if potentially harmful
   * Fails open (returns true) on errors or missing configuration
   * @param {string} text - Content to moderate
   * @returns {Promise<boolean>} - Safety status
   */
  static async checkText(text) {
    // Early return for empty content
    if (!text || text.trim() === "") return true;

    try {
      // Skip moderation if API token not configured
      if (!process.env.HF_TOKEN) {
        console.warn("HuggingFace token missing - skipping moderation");
        return true;
      }

      // Call HuggingFace text classification API
      const result = await LocalModeration.#hf.textClassification({
        model: "facebook/roberta-hate-speech-dynabench-r4-target",
        inputs: text,
      });

      // Label "hate" indicates harmful content
      return result[0].label !== "hate";
    } catch (error) {
      console.error("Moderation Error:", error);
      // Fail open (allow content) on API errors
      return true;
    }
  }
}

module.exports = LocalModeration;
