import { prisma } from "../index.js";

export async function getCompanyId(slug: string = "default"): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { slug },
  });
  if (!company) {
    throw new Error(`Company with slug "${slug}" not found`);
  }
  return company.id;
}
