// src/services/googleCloudService.js
const { ImageAnnotatorClient } = require("@google-cloud/vision");

// Google Cloud Vision client wrapper
class GoogleCloud {
  constructor() {
    // Initialize Vision client with credentials and project ID
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  /**
   * Performs safe search detection on an image buffer
   * @param {Buffer} imageBuffer - Image data to analyze
   * @returns {Promise<Object>} Safe search annotation results
   */
  async safeSearchDetection(imageBuffer) {
    try {
      // Analyze image for safe search properties
      const [result] = await this.client.safeSearchDetection({
        image: { content: imageBuffer },
      });
      return result.safeSearchAnnotation;
    } catch (error) {
      console.error("Google Cloud Vision Error:", error);
      throw error;
    }
  }
}

module.exports = new GoogleCloud();
