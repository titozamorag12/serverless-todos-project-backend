import { CustomAuthorizerEvent, CustomAuthorizerResult } from "aws-lambda";
import "source-map-support/register";

import { verify } from "jsonwebtoken";
import { JwtPayload } from "../../auth/JwtPayload";
import { createLogger } from "../../utils/logger";

const cert = `-----BEGIN CERTIFICATE-----
MIIDCzCCAfOgAwIBAgIJecDGy+QwHVKEMA0GCSqGSIb3DQEBCwUAMCMxITAfBgNV
BAMTGHVkYWdyYW10ZXN0LnVzLmF1dGgwLmNvbTAeFw0yMTAyMTcyMDA4MDBaFw0z
NDEwMjcyMDA4MDBaMCMxITAfBgNVBAMTGHVkYWdyYW10ZXN0LnVzLmF1dGgwLmNv
bTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMq2ef2jDvFCtQjeFj8U
uNU7ywSD5XmfjjNYQkypvgOoz7JWwybu67DTR7bdFvy57uTVI5ZH+Zu4yIL2dfpy
bAZbNA634VFCcBBQW41EsIu71HotNjgE9tB4cb0t0fuxvIreJ/rsYr8P309CebsF
xQCq86Y0Gr1EeJXlgRtyT3MlYWyLQqUzUOtGk8jNiaazEUGUiknkHlqOUYlHpOGi
eBIcgFzJupLr+/MlSd2PTiebGh5KM308VsTInQxflQwbbPmmR83alWBBILErcdyV
SUTvOHfRda7ys0D/gF7Z8XDQVH+Y3H6Bc6enOMEc2DRZFBV6G9m2bzEu2H4fMoee
Fx0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQU/q3sxFiBFNbI
HwV+D9dMIOkbfdowDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQBK
he4cLR7XYl7kgdadn97ioz5ybcpxJRJvUm2LdWM4WAgeRUjKQ35V/JocIwLjoN1a
sk2lH8HqHShXobqH5JCLo4GFXY49Woi5EW6f6u33OlLVMDV2WJuxH6uo1hQfu9h1
1PGxIY9K1Zr45qianeHFRYfTXv9qZlnJnyIm39EiWtAB/VPus1icyCVtHUzuBzVJ
UaCI80UafK3Rk3QGEJnYFdBqzyzLOyQVb2t9TMH9wc2KiwiBglTz0jmRIPnGbpaw
6iAk1S/LRD/xef/nKSZy/ad0gtqkI8/dOAxWxYdJjnNy4UyVBz24tXUDPJE0Xkuu
jRKWBmZCyEpusnVm1HTd
-----END CERTIFICATE-----`;

const logger = createLogger("todosAccess");

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  try {
    const jwtPayload = verifyToken(event.authorizationToken);
    logger.info("User was authorized", jwtPayload);

    return {
      principalId: jwtPayload.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    };
  } catch (e) {
    logger.info("User authorized", e.message);

    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    };
  }
};

function verifyToken(authHeader: string): JwtPayload {
  if (!authHeader) throw new Error("No authentication header");

  if (!authHeader.toLowerCase().startsWith("bearer "))
    throw new Error("Invalid authentication header");

  const split = authHeader.split(" ");
  const token = split[1];

  return verify(token, cert, { algorithms: ["RS256"] }) as JwtPayload;
}
