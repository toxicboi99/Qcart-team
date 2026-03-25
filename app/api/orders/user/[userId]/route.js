import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { userId } = await params;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(orders.map(serializeOrder));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch user orders", 400);
  }
}
