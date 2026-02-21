import { prisma } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanySettingsForm } from '@/components/settings/company-settings-form';
import { SocialSettingsForm } from '@/components/settings/social-settings-form';
import { BonusTiersForm } from '@/components/settings/bonus-tiers-form';
import { PaymentSettingsForm } from '@/components/settings/payment-settings-form';
import { HomepageSettingsForm } from '@/components/settings/homepage-settings-form';

async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'global' },
  });

  if (!settings?.data || typeof settings.data !== 'object') {
    return {};
  }

  const data = settings.data as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (value !== null && value !== undefined) {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}

async function getActiveCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      prizeValue: true,
      isFeatured: true,
    },
    orderBy: { prizeValue: 'desc' },
  });

  return competitions.map(c => ({
    ...c,
    prizeValue: Number(c.prizeValue),
  }));
}

export default async function SettingsPage() {
  const [settings, activeCompetitions] = await Promise.all([
    getSettings(),
    getActiveCompetitions(),
  ]);

  const currentFeaturedId = activeCompetitions.find(c => c.isFeatured)?.id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage site configuration and preferences
        </p>
      </div>

      <Tabs defaultValue="homepage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Tiers</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage">
          <HomepageSettingsForm
            activeCompetitions={activeCompetitions}
            currentFeaturedId={currentFeaturedId}
          />
        </TabsContent>

        <TabsContent value="company">
          <CompanySettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="social">
          <SocialSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="bonus">
          <BonusTiersForm settings={settings} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
