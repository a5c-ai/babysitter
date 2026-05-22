export function errorResponse(message, status = 500) {
  const code = status === 401 ? 'unauthorized' : status === 404 ? 'not_found' : status === 400 ? 'bad_request' : 'internal_error';
  return Response.json({ error: code, message }, { status });
}

export function invalidateApiCache() {
  const controllerUrl = process.env.KRATE_CONTROLLER_URL;
  if (controllerUrl) {
    fetch(`${controllerUrl}/api/cache/invalidate`, { method: 'POST' }).catch(() => {});
  }
}
