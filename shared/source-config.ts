import type { ItemType, SourceType } from "./schemas/domain";

interface AdapterBase {
  type: SourceType;
}

export interface FeedAdapterConfig extends AdapterBase {
  type: "rss" | "atom";
  url: string;
  dateSitemapUrl?: string;
  itemType: ItemType;
  provider: string | null;
  tags: string[];
}

export interface GitHubAdapterConfig extends AdapterBase {
  type: "github_releases";
  repository: string;
  provider: string;
  tags: string[];
}

export interface GitHubRepositoryAdapterConfig extends AdapterBase {
  type: "github_repository";
  repository: string;
  provider: string;
  projectName: string;
  kind: "agent" | "skill";
  surface: "terminal" | "desktop" | "browser" | "portable";
  description: string;
  tags: string[];
}

export interface JsonAdapterConfig extends AdapterBase {
  type: "json_api";
  kind: "openrouter_models" | "huggingface_models";
  url: string;
}

export interface ArxivAdapterConfig extends AdapterBase {
  type: "arxiv";
  url: string;
  categories: string[];
  terms: string[];
  maxResults: number;
}

export interface HackerNewsAdapterConfig extends AdapterBase {
  type: "hacker_news";
  baseUrl: string;
  terms: string[];
  storySample: number;
}

export interface ManualJsonAdapterConfig extends AdapterBase {
  type: "manual_json";
  kind: "events" | "benchmarks";
}

export interface HtmlMetadataAdapterConfig extends AdapterBase {
  type: "html_metadata";
  url: string;
  note: string;
}

export type AdapterConfig =
  | FeedAdapterConfig
  | GitHubAdapterConfig
  | GitHubRepositoryAdapterConfig
  | JsonAdapterConfig
  | ArxivAdapterConfig
  | HackerNewsAdapterConfig
  | ManualJsonAdapterConfig
  | HtmlMetadataAdapterConfig;

export interface SourceDefinition {
  id: string;
  slug: string;
  name: string;
  homepageUrl: string;
  trustTier: 0 | 1 | 2 | 3;
  enabled: boolean;
  adapter: AdapterConfig;
}

export const SOURCE_CONFIG: SourceDefinition[] = [
  {
    id: "src_openai_news",
    slug: "openai-news",
    name: "OpenAI News",
    homepageUrl: "https://openai.com/news/",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "rss",
      url: "https://openai.com/news/rss.xml",
      itemType: "announcement",
      provider: "OpenAI",
      tags: ["provider-announcement"],
    },
  },
  {
    id: "src_deepmind_news",
    slug: "deepmind-news",
    name: "Google DeepMind",
    homepageUrl: "https://deepmind.google/blog/",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "rss",
      url: "https://deepmind.google/blog/rss.xml",
      itemType: "announcement",
      provider: "Google DeepMind",
      tags: ["provider-announcement"],
    },
  },
  {
    id: "src_google_ai_developers",
    slug: "google-ai-developers",
    name: "Google for Developers",
    homepageUrl: "https://developers.googleblog.com/",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "rss",
      url: "https://developers.googleblog.com/feeds/posts/default/",
      dateSitemapUrl: "https://developers.googleblog.com/sitemap.xml",
      itemType: "announcement",
      provider: "Google",
      tags: ["developer-tools", "provider-announcement"],
    },
  },
  {
    id: "src_github_copilot",
    slug: "github-copilot",
    name: "GitHub Copilot Changelog",
    homepageUrl: "https://github.blog/changelog/label/copilot/",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "rss",
      url: "https://github.blog/changelog/label/copilot/feed/",
      itemType: "coding_tool",
      provider: "GitHub",
      tags: ["coding-agent", "copilot", "developer-tools"],
    },
  },
  {
    id: "src_huggingface_blog",
    slug: "huggingface-blog",
    name: "Hugging Face Blog",
    homepageUrl: "https://huggingface.co/blog",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "rss",
      url: "https://huggingface.co/blog/feed.xml",
      itemType: "announcement",
      provider: "Hugging Face",
      tags: ["open-weight", "provider-announcement"],
    },
  },
  {
    id: "src_anthropic_news",
    slug: "anthropic-news",
    name: "Anthropic News",
    homepageUrl: "https://www.anthropic.com/news",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://www.anthropic.com/news",
      note: "Disabled until Anthropic publishes a stable machine-readable feed. The adapter intentionally does not scrape article lists.",
    },
  },
  {
    id: "src_meta_ai",
    slug: "meta-ai",
    name: "Meta AI",
    homepageUrl: "https://ai.meta.com/blog/",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://ai.meta.com/blog/",
      note: "Disabled because no stable official feed was verified.",
    },
  },
  {
    id: "src_mistral_news",
    slug: "mistral-news",
    name: "Mistral AI News",
    homepageUrl: "https://mistral.ai/news",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://mistral.ai/news",
      note: "Disabled because no stable official feed was verified.",
    },
  },
  {
    id: "src_microsoft_ai",
    slug: "microsoft-ai",
    name: "Microsoft AI",
    homepageUrl: "https://blogs.microsoft.com/ai/",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://blogs.microsoft.com/ai/",
      note: "Disabled after the former official feed began returning HTTP 410.",
    },
  },
  {
    id: "src_qwen_news",
    slug: "qwen-news",
    name: "Qwen",
    homepageUrl: "https://qwenlm.github.io/",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://qwenlm.github.io/",
      note: "Disabled because no stable official feed was verified.",
    },
  },
  {
    id: "src_deepseek_news",
    slug: "deepseek-news",
    name: "DeepSeek",
    homepageUrl: "https://api-docs.deepseek.com/news/",
    trustTier: 3,
    enabled: false,
    adapter: {
      type: "html_metadata",
      url: "https://api-docs.deepseek.com/news/",
      note: "Disabled because no stable official feed was verified.",
    },
  },
  {
    id: "src_codex_releases",
    slug: "codex-releases",
    name: "Codex releases",
    homepageUrl: "https://github.com/openai/codex/releases",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "github_releases",
      repository: "openai/codex",
      provider: "OpenAI",
      tags: ["coding-agent", "cli", "codex"],
    },
  },
  {
    id: "src_claude_code_releases",
    slug: "claude-code-releases",
    name: "Claude Code releases",
    homepageUrl: "https://github.com/anthropics/claude-code/releases",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "github_releases",
      repository: "anthropics/claude-code",
      provider: "Anthropic",
      tags: ["coding-agent", "cli", "claude-code"],
    },
  },
  {
    id: "src_gemini_cli_releases",
    slug: "gemini-cli-releases",
    name: "Gemini CLI releases",
    homepageUrl: "https://github.com/google-gemini/gemini-cli/releases",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "github_releases",
      repository: "google-gemini/gemini-cli",
      provider: "Google",
      tags: ["coding-agent", "cli", "gemini-cli"],
    },
  },
  {
    id: "src_aider_releases",
    slug: "aider-releases",
    name: "Aider releases",
    homepageUrl: "https://github.com/Aider-AI/aider/releases",
    trustTier: 3,
    enabled: true,
    adapter: {
      type: "github_releases",
      repository: "Aider-AI/aider",
      provider: "Aider",
      tags: ["coding-agent", "cli", "aider", "open-source"],
    },
  },
  {
    id: "src_openrouter_models",
    slug: "openrouter-models",
    name: "OpenRouter Models API",
    homepageUrl: "https://openrouter.ai/models",
    trustTier: 1,
    enabled: true,
    adapter: {
      type: "json_api",
      kind: "openrouter_models",
      url: "https://openrouter.ai/api/v1/models",
    },
  },
  {
    id: "src_huggingface_models",
    slug: "huggingface-models",
    name: "Hugging Face Hub API",
    homepageUrl: "https://huggingface.co/models",
    trustTier: 1,
    enabled: true,
    adapter: {
      type: "json_api",
      kind: "huggingface_models",
      url: "https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=30&pipeline_tag=text-generation",
    },
  },
  {
    id: "src_arxiv",
    slug: "arxiv",
    name: "arXiv",
    homepageUrl: "https://arxiv.org/",
    trustTier: 2,
    enabled: true,
    adapter: {
      type: "arxiv",
      url: "https://export.arxiv.org/api/query",
      categories: ["cs.AI", "cs.CL", "cs.SE"],
      terms: [
        "code generation",
        "software engineering agents",
        "repository-level coding",
        "tool use",
        "reasoning",
        "inference efficiency",
        "evaluation",
        "model context",
        "retrieval",
        "multimodal agents",
      ],
      maxResults: 18,
    },
  },
  {
    id: "src_hacker_news",
    slug: "hacker-news",
    name: "Hacker News",
    homepageUrl: "https://news.ycombinator.com/",
    trustTier: 0,
    enabled: true,
    adapter: {
      type: "hacker_news",
      baseUrl: "https://hacker-news.firebaseio.com/v0",
      terms: [
        "llm",
        "ai model",
        "coding agent",
        "codex",
        "claude code",
        "gemini cli",
        "inference",
        "benchmark",
        "open weights",
        "model release",
      ],
      storySample: 10,
    },
  },
  {
    id: "src_manual_events",
    slug: "manual-events",
    name: "Verified event curation",
    homepageUrl: "https://ai-signal-euo.pages.dev/#methodology",
    trustTier: 3,
    enabled: true,
    adapter: { type: "manual_json", kind: "events" },
  },
  {
    id: "src_benchmark_snapshots",
    slug: "benchmark-snapshots",
    name: "Benchmark snapshots",
    homepageUrl: "https://ai-signal-euo.pages.dev/#methodology",
    trustTier: 3,
    enabled: true,
    adapter: { type: "manual_json", kind: "benchmarks" },
  },
  {
    id: "src_codex_repository",
    slug: "codex-repository",
    name: "Codex repository activity",
    homepageUrl: "https://github.com/openai/codex",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "openai/codex", provider: "OpenAI", projectName: "Codex CLI", kind: "agent", surface: "terminal", description: "OpenAI coding agent for the terminal and desktop workflows.", tags: ["coding-agent", "terminal", "local"] },
  },
  {
    id: "src_claude_code_repository",
    slug: "claude-code-repository",
    name: "Claude Code repository activity",
    homepageUrl: "https://github.com/anthropics/claude-code",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "anthropics/claude-code", provider: "Anthropic", projectName: "Claude Code", kind: "agent", surface: "terminal", description: "Anthropic coding agent for terminal-led repository work.", tags: ["coding-agent", "terminal", "local"] },
  },
  {
    id: "src_gemini_cli_repository",
    slug: "gemini-cli-repository",
    name: "Gemini CLI repository activity",
    homepageUrl: "https://github.com/google-gemini/gemini-cli",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "google-gemini/gemini-cli", provider: "Google", projectName: "Gemini CLI", kind: "agent", surface: "terminal", description: "Open-source Gemini agent that works inside the terminal.", tags: ["coding-agent", "terminal", "local"] },
  },
  {
    id: "src_aider_repository",
    slug: "aider-repository",
    name: "Aider repository activity",
    homepageUrl: "https://github.com/Aider-AI/aider",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "Aider-AI/aider", provider: "Aider", projectName: "Aider", kind: "agent", surface: "terminal", description: "Open-source pair programmer built around a terminal workflow.", tags: ["coding-agent", "terminal", "local", "open-source"] },
  },
  {
    id: "src_cline_repository",
    slug: "cline-repository",
    name: "Cline repository activity",
    homepageUrl: "https://github.com/cline/cline",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "cline/cline", provider: "Cline", projectName: "Cline", kind: "agent", surface: "desktop", description: "Agentic coding extension that runs inside desktop editors.", tags: ["coding-agent", "desktop", "editor"] },
  },
  {
    id: "src_roo_code_repository",
    slug: "roo-code-repository",
    name: "Roo Code repository activity",
    homepageUrl: "https://github.com/RooCodeInc/Roo-Code",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "RooCodeInc/Roo-Code", provider: "Roo Code", projectName: "Roo Code", kind: "agent", surface: "desktop", description: "Open-source agentic coding extension for desktop editors.", tags: ["coding-agent", "desktop", "editor", "open-source"] },
  },
  {
    id: "src_openhands_repository",
    slug: "openhands-repository",
    name: "OpenHands repository activity",
    homepageUrl: "https://github.com/OpenHands/OpenHands",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "OpenHands/OpenHands", provider: "OpenHands", projectName: "OpenHands", kind: "agent", surface: "browser", description: "Open coding-agent platform with local, self-hosted, and browser cloud surfaces.", tags: ["coding-agent", "browser", "cloud", "open-source"] },
  },
  {
    id: "src_openai_skills_repository",
    slug: "openai-skills-repository",
    name: "OpenAI Skills repository activity",
    homepageUrl: "https://github.com/openai/skills",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "openai/skills", provider: "OpenAI", projectName: "OpenAI Skills", kind: "skill", surface: "portable", description: "Reusable task instructions for coding and general-purpose agents.", tags: ["agent-skill", "portable", "open-source"] },
  },
  {
    id: "src_anthropic_skills_repository",
    slug: "anthropic-skills-repository",
    name: "Anthropic Skills repository activity",
    homepageUrl: "https://github.com/anthropics/skills",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "anthropics/skills", provider: "Anthropic", projectName: "Anthropic Skills", kind: "skill", surface: "portable", description: "Public skill examples and specifications for agent workflows.", tags: ["agent-skill", "portable", "open-source"] },
  },
  {
    id: "src_huggingface_skills_repository",
    slug: "huggingface-skills-repository",
    name: "Hugging Face Skills repository activity",
    homepageUrl: "https://github.com/huggingface/skills",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "huggingface/skills", provider: "Hugging Face", projectName: "Hugging Face Skills", kind: "skill", surface: "portable", description: "Portable agent skills for datasets, training, evaluation, and Hub workflows.", tags: ["agent-skill", "portable", "open-source"] },
  },
  {
    id: "src_agent_skills_standard_repository",
    slug: "agent-skills-standard-repository",
    name: "Agent Skills standard activity",
    homepageUrl: "https://github.com/agentskills/agentskills",
    trustTier: 2,
    enabled: true,
    adapter: { type: "github_repository", repository: "agentskills/agentskills", provider: "Agent Skills", projectName: "Agent Skills standard", kind: "skill", surface: "portable", description: "Open format and documentation for packaging reusable agent capabilities.", tags: ["agent-skill", "portable", "standard", "open-source"] },
  },
];

export const ENABLED_SOURCES = SOURCE_CONFIG.filter((source) => source.enabled);
