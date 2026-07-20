import { ArrowSquareOut, Browser, Desktop, Terminal, Toolbox } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { CodingLandscapeEntry } from "@shared/schemas/domain";

function compactNumber(value: number | null): string {
  if (value === null) return "syncing";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function AgentRow({ entry }: { entry: CodingLandscapeEntry }) {
  const Icon = entry.surface === "terminal" ? Terminal : entry.surface === "desktop" ? Desktop : Browser;
  return (
    <a className="agent-row" href={entry.url} target="_blank" rel="noopener noreferrer">
      <span className="agent-row__icon"><Icon aria-hidden="true" /></span>
      <span className="agent-row__name"><strong>{entry.name}</strong><small>{entry.surface} · {entry.provider}</small></span>
      <span className="agent-row__metric"><b>{entry.momentumScore ?? "–"}</b><small>momentum</small></span>
      <ArrowSquareOut className="agent-row__out" aria-hidden="true" />
    </a>
  );
}

export function ToolLandscape({ entries }: { entries: CodingLandscapeEntry[] }) {
  const agents = entries.filter((entry) => entry.kind === "agent");
  const local = agents.filter((entry) => entry.surface === "terminal" || entry.surface === "desktop").slice(0, 5);
  const browser = agents.filter((entry) => entry.surface === "browser").slice(0, 4);
  const skills = entries.filter((entry) => entry.kind === "skill").slice(0, 5);

  return (
    <section className="landscape-section" aria-labelledby="agents-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agent momentum</p>
          <h2 id="agents-heading">Where the coding happens matters.</h2>
          <p>Local tools work against files on your machine. Browser and cloud agents run in hosted or self-hosted workspaces.</p>
        </div>
      </div>

      <div className="surface-lanes">
        <div className="surface-lane">
          <div className="surface-lane__heading"><span><Terminal aria-hidden="true" /><strong>Terminal + PC</strong></span><small>local context</small></div>
          <div className="agent-list">{local.length ? local.map((entry) => <AgentRow key={entry.id} entry={entry} />) : <p className="compact-empty">Local agent sources are awaiting sync.</p>}</div>
        </div>
        <div className="surface-lane surface-lane--browser">
          <div className="surface-lane__heading"><span><Browser aria-hidden="true" /><strong>Browser + cloud</strong></span><small>remote workspace</small></div>
          <div className="agent-list">{browser.length ? browser.map((entry) => <AgentRow key={entry.id} entry={entry} />) : <p className="compact-empty">No verified browser-agent activity is available yet.</p>}</div>
          <p className="lane-note">Some products offer both surfaces. They are placed by the repository activity tracked here.</p>
        </div>
      </div>

      <div className="skills-panel">
        <div className="skills-panel__heading">
          <span><Toolbox aria-hidden="true" /><strong>Skills gaining attention</strong></span>
          <small>GitHub interest + recent maintenance</small>
        </div>
        <div className="skill-bars">
          {skills.length ? skills.map((skill, index) => (
            <a key={skill.id} className="skill-bar" href={skill.url} target="_blank" rel="noopener noreferrer">
              <span className="skill-bar__rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="skill-bar__body">
                <span><strong>{skill.name}</strong><small>{compactNumber(skill.stars)} stars{skill.pushedAt ? ` · pushed ${formatCapeTownDate(skill.pushedAt)}` : ""}</small></span>
                <span className="skill-bar__track"><span style={{ width: `${skill.momentumScore ?? 0}%` }} /></span>
              </span>
              <b>{skill.momentumScore ?? "–"}</b>
              <ArrowSquareOut aria-hidden="true" />
            </a>
          )) : <p className="compact-empty">Skill repositories are awaiting their first verified sync.</p>}
        </div>
      </div>

      <p className="method-note">Momentum is a relative maintenance and community-interest signal. Stars and recent pushes do not measure coding quality.</p>
    </section>
  );
}
