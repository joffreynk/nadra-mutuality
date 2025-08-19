import { prisma } from "./prisma";

export async function generateMainMemberCode() {
  const latestMember = await prisma.member.findFirst({
    where: { isDependent: false },
    orderBy: { createdAt: "desc" },
  });

  let nextNumber = 1;
  if (latestMember?.memberCode) {
    const lastNumber = parseInt(latestMember.memberCode.replace("Nadra", ""), 10);
    nextNumber = lastNumber + 1;
  }
  return `Nadra${String(nextNumber).padStart(4, "0")}`;
}

export async function generateDependentMemberCode(mainMemberId: string) {
  const mainMember = await prisma.member.findUnique({
    where: { id: mainMemberId },
    // We need to fetch dependents, but Prisma doesn't directly support `include: { dependents: true }`
    // when `dependents` is not a direct relation. We'll fetch them separately.
  });

  if (!mainMember) throw new Error("Main member not found");

  const dependents = await prisma.member.findMany({
    where: {
      isDependent: true,
      memberCode: {
        startsWith: `${mainMember.memberCode}/`
      }
    }
  });

  const dependentCount = dependents.length + 1;
  return `${mainMember.memberCode}/${dependentCount}`;
}
