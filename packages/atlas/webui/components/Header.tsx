import Link from "next/link";
import { BookOpenText, GitBranch, MessageCircle, Network } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderAuthState } from "./HeaderAuthState";

export function Header() {
  return (
    <header className="atlas-header">
      <div className="atlas-header__inner">
        <Link href="/" className="atlas-header__brand">
          <Network style={{ width: 22, height: 22 }} />
          <div>
            <strong>Agentic AI Atlas</strong>
            <span>by a5c.ai</span>
          </div>
        </Link>

        <nav className="atlas-header__nav">
          <Link href="/">Overview</Link>
          <Link href="/wiki">Wiki</Link>
          <Link href="/graph">Graph</Link>
          <Link href="/for-agents">For Agents</Link>
          <Link href="/edges">Edges</Link>
          <Link href="/search">Search</Link>
          <Link href="/workspace">Workspace</Link>
        </nav>

        <div className="atlas-header__actions">
          <div className="atlas-header__search">
            <SearchBar />
          </div>
          <a
            href="https://github.com/a5c-ai/babysitter/tree/main/packages/atlas"
            target="_blank"
            rel="noreferrer"
            className="atlas-header__link"
          >
            <GitBranch style={{ width: 15, height: 15 }} />
            <span>GitHub</span>
          </a>
          <Link href="/wiki/docs" className="atlas-header__link">
            <BookOpenText style={{ width: 15, height: 15 }} />
            <span>Docs</span>
          </Link>
          <a
            href="https://discord.gg/tjgmhJz6fF"
            target="_blank"
            rel="noreferrer"
            className="atlas-header__link"
          >
            <MessageCircle style={{ width: 15, height: 15 }} />
            <span>Discord</span>
          </a>
          <HeaderAuthState />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
