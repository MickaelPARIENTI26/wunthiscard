import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ReferralSettingsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Rewards</CardTitle>
        <CardDescription>
          How the referral programme works. This rule is fixed and requires no configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Every user gets a unique referral link. When someone signs up through that link
          they become a <strong>referee</strong> of the referrer.
        </p>
        <p>
          The first time a referee completes a successful purchase, the referrer earns
          <strong> 1 free ticket</strong> — regardless of how many tickets the referee buys.
        </p>
        <p>
          Each referee can reward their referrer <strong>only once</strong>. Subsequent
          purchases by the same referee never grant additional free tickets.
        </p>
        <p>
          Referrers redeem their free tickets at checkout when buying 2 or more tickets.
        </p>
      </CardContent>
    </Card>
  );
}
