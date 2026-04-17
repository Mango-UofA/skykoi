import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

import { getAwsConfig, hasAwsCredentials } from "../config/aws.js";

let cachedStatus = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function createStsClient() {
  const config = getAwsConfig();

  return new STSClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

export async function getAwsStatus(forceRefresh = false) {
  if (!hasAwsCredentials()) {
    return {
      connected: false,
      provider: "aws",
      region: getAwsConfig().region,
      message: "AWS credentials are not configured"
    };
  }

  if (!forceRefresh && cachedStatus && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedStatus;
  }

  try {
    const client = createStsClient();
    const identity = await client.send(new GetCallerIdentityCommand({}));

    cachedStatus = {
      connected: true,
      provider: "aws",
      region: getAwsConfig().region,
      accountId: identity.Account || "",
      arn: identity.Arn || "",
      userId: identity.UserId || "",
      message: "AWS account connected"
    };
    cachedAt = Date.now();

    return cachedStatus;
  } catch (error) {
    cachedStatus = {
      connected: false,
      provider: "aws",
      region: getAwsConfig().region,
      message: error?.name === "InvalidClientTokenId" ? "AWS credentials are invalid" : "Unable to reach AWS"
    };
    cachedAt = Date.now();

    return cachedStatus;
  }
}
