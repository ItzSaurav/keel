import { db } from "@/lib/db";
import { getContext, requestMeta } from "@/lib/session";
import { auditEvent } from "@/lib/audit";
import { parseStringArray } from "@/lib/consent";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const app = await getContext();
  if (!app.can("manage_security")) {
    return new Response("Your role cannot export end-user data.", { status: 403 });
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request");
  const endUser = await db.endUser.findFirst({ where: { id, projectId: app.project.id } });
  if (!endUser || endUser.deletedAt) {
    return new Response("End user not found.", { status: 404 });
  }

  const environments = await db.environment.findMany({
    where: { projectId: app.project.id },
    select: { id: true },
  });
  const [consents, credentials, dataRequests, events] = await Promise.all([
    db.consent.findMany({
      where: { endUserId: endUser.id, projectId: app.project.id },
      orderBy: { grantedAt: "desc" },
    }),
    db.credential.findMany({
      where: { endUserId: endUser.id, environment: { projectId: app.project.id } },
      select: {
        id: true,
        name: true,
        connectorSlug: true,
        type: true,
        status: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.dataRequest.findMany({
      where: { endUserId: endUser.id, projectId: app.project.id },
      orderBy: { createdAt: "desc" },
    }),
    db.agentEvent.findMany({
      where: { endUserId: endUser.id, environmentId: { in: environments.map((environment) => environment.id) } },
      orderBy: { occurredAt: "desc" },
      take: 5000,
    }),
  ]);

  const exportRequest = requestId
    ? dataRequests.find((request) => request.id === requestId) ?? null
    : null;
  const payload = {
    exportedAt: new Date().toISOString(),
    dataRequest: exportRequest
      ? {
          id: exportRequest.id,
          kind: exportRequest.kind,
          status: exportRequest.status,
          createdAt: exportRequest.createdAt.toISOString(),
          completedAt: exportRequest.completedAt?.toISOString() ?? null,
        }
      : null,
    endUser: {
      id: endUser.id,
      externalUserId: endUser.externalUserId,
      email: endUser.email,
      createdAt: endUser.createdAt.toISOString(),
      lastSeenAt: endUser.lastSeenAt?.toISOString() ?? null,
    },
    consents: consents.map((consent) => ({
      id: consent.id,
      agentId: consent.agentId,
      scopes: parseStringArray(consent.scopesJson),
      consentTextVersion: consent.consentTextVersion,
      grantedAt: consent.grantedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString() ?? null,
      revokedAt: consent.revokedAt?.toISOString() ?? null,
      lastUsedAt: consent.lastUsedAt?.toISOString() ?? null,
    })),
    connections: credentials.map((credential) => ({
      id: credential.id,
      name: credential.name,
      connector: credential.connectorSlug,
      type: credential.type,
      status: credential.revokedAt ? "revoked" : credential.status,
      createdAt: credential.createdAt.toISOString(),
      lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      expiresAt: credential.expiresAt?.toISOString() ?? null,
      revokedAt: credential.revokedAt?.toISOString() ?? null,
    })),
    dataRequests: dataRequests.map((request) => ({
      id: request.id,
      kind: request.kind,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      completedAt: request.completedAt?.toISOString() ?? null,
    })),
    agentEvents: events.map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      requestId: event.requestId,
      agentId: event.agentId,
      agentType: event.agentType,
      connector: event.connectorSlug,
      action: event.action,
      riskClass: event.riskClass,
      resourceType: event.resourceType,
      decision: event.decision,
      decisionReasonCode: event.decisionReasonCode,
      approvalLatencyMs: event.approvalLatencyMs,
      upstreamStatusClass: event.upstreamStatusClass,
      latencyMs: event.latencyMs,
      isSandbox: event.isSandbox,
      endUserExternalId: event.endUserExternalId,
    })),
  };

  const meta = await requestMeta();
  await auditEvent({
    environmentId: app.environment.id,
    actorType: "human",
    actorId: app.user.id,
    actorName: app.user.name,
    action: "end_user.exported",
    resourceType: "end_user",
    resourceId: endUser.id,
    outcome: "recorded",
    ip: meta.ip,
    payloadSummary: {
      externalUserId: endUser.externalUserId,
      dataRequestId: exportRequest?.id ?? null,
      consents: consents.length,
      connections: credentials.length,
      agentEvents: events.length,
    },
  }).catch(() => null);

  const suffix = endUser.externalUserId.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || endUser.id;
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="authab-end-user-${suffix}.json"`,
      "cache-control": "no-store",
    },
  });
}
