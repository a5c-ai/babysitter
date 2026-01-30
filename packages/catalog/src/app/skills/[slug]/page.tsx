import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { SkillDetail } from "@/components/catalog/DetailView/SkillDetail";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SkillDetail as SkillDetailType, SkillListItem } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSkill(slug: string): Promise<SkillDetailType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/skills/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function getRelatedSkills(
  domainName: string | null,
  specializationName: string | null,
  currentId: number
): Promise<SkillListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "6" });
    if (specializationName) {
      params.set("specialization", specializationName);
    } else if (domainName) {
      params.set("domain", domainName);
    }

    const res = await fetch(`${baseUrl}/api/skills?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    // Filter out current skill and limit to 5
    return (json.data || []).filter((s: SkillListItem) => s.id !== currentId).slice(0, 5);
  } catch {
    return [];
  }
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkill(decodeURIComponent(slug));

  if (!skill) {
    notFound();
  }

  const relatedSkills = await getRelatedSkills(
    skill.domainName,
    skill.specializationName,
    skill.id
  );

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Skills", href: "/skills" },
  ];

  if (skill.domainName) {
    breadcrumbItems.push({
      label: skill.domainName,
      href: `/domains/${encodeURIComponent(skill.domainName)}`,
    });
  }

  if (skill.specializationName) {
    breadcrumbItems.push({
      label: skill.specializationName,
      href: `/specializations/${encodeURIComponent(skill.specializationName)}`,
    });
  }

  breadcrumbItems.push({ label: skill.name });

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} />

      <SkillDetail
        skill={skill}
        relatedSkills={relatedSkills.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        }))}
      />

      {/* Rendered Markdown Content */}
      {skill.content && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer content={skill.content} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkill(decodeURIComponent(slug));

  if (!skill) {
    return {
      title: "Skill Not Found",
    };
  }

  return {
    title: `${skill.name} - Skills - Process Catalog`,
    description: skill.description || `View details for the ${skill.name} skill`,
  };
}
