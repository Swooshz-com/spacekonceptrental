import "server-only";

type ApplicationErrorLogInput = {
  category: string;
  reference: string;
  request?: Request;
  route: string;
  statusCode: number;
};

function getSafeRequestPath(request: Request | undefined) {
  if (!request) {
    return undefined;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return undefined;
  }
}

export function logApplicationError({
  category,
  reference,
  request,
  route,
  statusCode
}: ApplicationErrorLogInput) {
  console.error("application_error", {
    category,
    errorReference: reference,
    method: request?.method,
    path: getSafeRequestPath(request),
    route,
    statusCode,
    timestamp: new Date().toISOString()
  });
}
