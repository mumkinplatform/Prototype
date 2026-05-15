import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { SponsorHome } from "./components/SponsorHome";
import { SponsorSponsorships } from "./components/SponsorSponsorships";
import { MessagesPage } from "./components/MessagesPage";
import { HackathonsExplore } from "./components/HackathonsExplore";
import { HackathonDetails } from "./components/HackathonDetails";
import { ParticipantDashboard } from "./components/ParticipantDashboard";
import { ParticipantHackathons } from "./components/ParticipantHackathons";
import { ParticipantHackathonDetails } from "./components/ParticipantHackathonDetails";
import { SmartMatchmaking } from "./components/SmartMatchmaking";
import { CreateHackathon } from "./components/CreateHackathon";
import MyHackathons from "./components/MyHackathons";
import HackathonPreview from "./components/HackathonPreview";
import HackathonManagement from "./components/HackathonManagement";
import { AdminSponsorships } from "./components/AdminSponsorships";
import { HackathonProjects } from "./components/HackathonProjects";
import { HackathonRegistrations } from "./components/HackathonRegistrations";
import { HackathonTeams } from "./components/HackathonTeams";
import { HackathonSponsors } from "./components/HackathonSponsors";
import { Notifications } from "./components/Notifications";
import { Profile } from "./components/Profile";
import { ParticipantProfile } from "./components/ParticipantProfile";
import { SponsorNotifications } from "./components/SponsorNotifications";
import { SponsorProfile } from "./components/SponsorProfile";
import { SponsorLayout } from "./components/SponsorLayout";
import { ParticipantLayout } from "./components/ParticipantLayout";
import { ParticipantNotifications } from "./components/ParticipantNotifications";
import { ParticipantWorkspace } from "./components/ParticipantWorkspace";
import { AdminLayout } from "./components/AdminLayout";
import { RootLayout } from "./components/RootLayout";
import { VerifyOTP } from "./components/VerifyOTP";
import { ForgotPassword } from "./components/ForgotPassword";
import { PublicHackathonPage } from "./components/PublicHackathonPage";
import { SystemStatus } from "./components/SystemStatus";
import { InviteAcceptPage } from "./components/InviteAcceptPage";
import { TeamInviteAcceptPage } from "./components/TeamInviteAcceptPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: LandingPage },
          { path: "auth", Component: AuthPage },
          { path: "verify-otp", Component: VerifyOTP },
          { path: "forgot-password", Component: ForgotPassword },
          { path: "system-status", Component: SystemStatus },
        ],
      },
      /* ── Public hackathon page (no platform layout) ── */
      { path: "hackathon/:slug", Component: PublicHackathonPage },
      /* ── Invitation acceptance landing (public) ── */
      { path: "invite/:token", Component: InviteAcceptPage },
      /* ── Team invitation acceptance (public; for participant-to-participant invites) ── */
      { path: "team-invite/:token", Component: TeamInviteAcceptPage },
      /* ── Admin (independent layout) ── */
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "create-hackathon", Component: CreateHackathon },
          { path: "create-hackathon/:id", Component: CreateHackathon },
          { path: "my-hackathons", Component: MyHackathons },
          { path: "hackathon-preview", Component: HackathonPreview },
          { path: "hackathon-preview/:id", Component: HackathonPreview },
          { path: "hackathon/:id", Component: HackathonManagement },
          { path: "hackathon/:id/projects", Component: HackathonProjects },
          { path: "hackathon/:id/registrations", Component: HackathonRegistrations },
          { path: "hackathon/:id/teams", Component: HackathonTeams },
          { path: "hackathon/:id/sponsors", Component: HackathonSponsors },
          { path: "sponsorships", Component: AdminSponsorships },
          { path: "notifications", Component: Notifications },
          { path: "profile", Component: Profile },
        ],
      },
      /* ── Sponsor (independent layout) ── */
      {
        path: "sponsor",
        Component: SponsorLayout,
        children: [
          { index: true, Component: SponsorHome },
          { path: "sponsorships", Component: SponsorSponsorships },
          { path: "opportunities", Component: HackathonsExplore },
          { path: "hackathon/:id", Component: HackathonDetails },
          { path: "messages", Component: MessagesPage },
          { path: "notifications", Component: SponsorNotifications },
          { path: "profile", Component: SponsorProfile },
        ],
      },
      /* ── Participant (independent layout) ── */
      {
        path: "participant",
        Component: ParticipantLayout,
        children: [
          { index: true, Component: ParticipantDashboard },
          { path: "hackathons", Component: ParticipantHackathons },
          { path: "hackathon/:id", Component: ParticipantHackathonDetails },
          { path: "workspace", Component: ParticipantWorkspace },
          { path: "matchmaking", Component: SmartMatchmaking },
          { path: "messages", Component: MessagesPage },
          { path: "notifications", Component: ParticipantNotifications },
          { path: "profile", Component: ParticipantProfile },
        ],
      },
    ],
  },
], { basename: '/Prototype/' });