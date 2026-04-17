import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getAwsConfig, hasAwsCredentials } from "../config/aws.js";

function createS3Client() {
  const config = getAwsConfig();

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

export function hasS3Bucket() {
  const config = getAwsConfig();
  return Boolean(hasAwsCredentials() && config.s3Bucket);
}

export async function uploadArtifactToS3({ userId, artifactId, filename, content, contentType = "text/plain; charset=utf-8" }) {
  if (!hasS3Bucket()) {
    return {
      uploaded: false,
      provider: "mongo",
      bucket: "",
      key: "",
      url: ""
    };
  }

  const config = getAwsConfig();
  const client = createS3Client();
  const safeFile = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `artifacts/${userId}/${artifactId}/${safeFile}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: content,
      ContentType: contentType
    })
  );

  return {
    uploaded: true,
    provider: "s3",
    bucket: config.s3Bucket,
    key,
    url: `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/${key}`
  };
}
