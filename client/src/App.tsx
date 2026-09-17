import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Docs from "./pages/Docs";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import MintDetail from "./pages/MintDetail";
import NotFound from "./pages/NotFound";
import Panics from "./pages/Panics";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import WalletDetail from "./pages/WalletDetail";
import WalletProviders from "./components/WalletProviders";

function Router() {
  return <Switch><Route path="/" component={Landing} /><Route path="/dashboard" component={Home} /><Route path="/panics" component={Panics} /><Route path="/docs" component={Docs} /><Route path="/mint/:symbol" component={MintDetail} /><Route path="/profile" component={Profile} /><Route path="/signin" component={SignIn} /><Route path="/leaderboard" component={Leaderboard} /><Route path="/wallet/:address" component={WalletDetail} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><WalletProviders><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></WalletProviders></ErrorBoundary>;
}
