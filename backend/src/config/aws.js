import "dotenv/config";

export function getAwsConfig() {
  return {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bedrockApiKey:
      process.env.BEDROCK_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK || "",
    bedrockModelId:
      process.env.AWS_BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0",
    s3Bucket: process.env.AWS_S3_BUCKET || ""
  };
}

export function hasAwsCredentials() {
  const config = getAwsConfig();
  return Boolean(config.accessKeyId && config.secretAccessKey && config.region);
}

export function hasBedrockCredentials() {
  const config = getAwsConfig();
  return Boolean(
    config.region &&
      (config.bedrockApiKey || (config.accessKeyId && config.secretAccessKey))
  );
}
