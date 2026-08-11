---
name: jira-ticket
description: Read a KBHH Jira ticket via the Atlassian MCP server and turn it into a work brief mapped to real files. Use when a Jira key is mentioned, or for "pick up this ticket", "what does this ticket need", or commenting on / transitioning an issue.
argument-hint: <KBHH-####>
---

# Jira ticket → work brief

Front half of `feature-development` and `bugfix`. Produce the brief; do not start coding.

## 1. Fetch (Atlassian MCP, site `kenvue.atlassian.net`)

⚠️ **The `description` field is only the user-story one-liner. The real spec is in
`customfield_10236` ("Acceptance Criteria"), as HTML.** Read only the description and you
build the wrong thing.

Request explicitly — these are custom and won't come back by default:

| Field | ID |
|---|---|
| **Acceptance Criteria** | `customfield_10236` |
| Environment Affected | `customfield_10080` |
| Epic Link | `customfield_10014` |
| Sprint / Story Points | `customfield_10020` / `10030` |

Plus `parent`, `fixVersion`, `labels`, `attachments`, `comments`, `issuelinks`.

**Summaries encode the code area:** `QA - Admin Console - Tool Management : Add New Tool -
Tool Persona -2` → `<Phase> - <Area> - <Sub-area> : <Feature>`. Parse it; it beats the prose.

**Links first:** `is blocked by` → check the blocker's status *before* planning.
`clones` → the source is usually already built; best prior art available.
`is tested by` → QA ticket, often has the cases the AC omitted.

**Comments defer to other tickets** ("Delete flow was explained in US-3203") — chase those.
The newest comment beats the status field; QA reassigns to Dev in "In Progress" on re-open.

No MCP? Ask for the Acceptance Criteria field and comments, or the XML export
(`/si/jira.issueviews:issue-xml/KBHH-1234/KBHH-1234.xml`). Never invent ticket content.

## 2. Brief

```
TICKET   <KEY> — <summary>
TYPE     <type>  STATUS <status>  POINTS <n>  EPIC <epic>
BLOCKED BY  <key + status, or "nothing open">
PRIOR ART   <clone source / sibling, or "none">
GOAL     <one sentence>
ACCEPTANCE CRITERIA   (verbatim from customfield_10236)
SCOPE IN CODE         (real paths, verified by searching)
DATA / API
OPEN QUESTIONS
```

AC quoted, never paraphrased; empty AC → `NOT SPECIFIED` + first open question. Paths must
be ones you actually found. Ambiguity that changes the implementation → ask, don't guess.

Worked example: [example-brief.md](./example-brief.md).

## 3. Area → code

| Ticket says | Look in |
|---|---|
| tool management, tool persona, tool type, AD group | `screens/tool-management/{add-new-tool,edit-tool}`, `organisms/tool-management-table`, `molecules/tool-persona-{edit-card,flyout}`, `services/tool.ts` |
| forum, persona mapping, forum owner | `screens/forum-management`, `organisms/{forums,add-new-forum,forumManagement}`, `store/slice/forum*` |
| role, permission, delegation, admin | `screens/{role-management,permission-management,admin-console}`, `services/{roles,permission,delegation*}.ts` |
| to-do, snooze, ignore | `screens/todo`, `organisms/todo`, `store/slice/todo*`, `services/todo.ts` |
| KPI, scorecard, performance, widget | `organisms/{kpi-cards,performance-management*}`, `services/performanceManagementWidgets.ts` |
| tag | `screens/tags`, `organisms/{tags,add-new-tag}`, `services/tags.ts` |
| notification, alert rule | `organisms/notifications-bell-icon-flyout`, `services/alertnotificationRules.ts` |
| global/local filter, filter group | `organisms/{global-filters,local-filters}`, `store/slice/*filter*` |
| chatbot, Kai | `organisms/kai-chatbot`, `services/{kaiChatbotService,chatbot}.ts` |
| issue, risk, opportunity, exception | `screens/issue-management`, `organisms/side-navigation/ExceptionFlyout` |
| knowledge hub, forecasting, gemba, truck inspection, digital worker, DPM | **remote MFE — other repo** |

## 4. Next

Branch off `development`: `feature/KBHH-####-summary` or `bugfix/…`.
Story/Task → `feature-development`. Bug → `bugfix`.

Jira write-back (comment, transition) only on explicit go-ahead — fetch available
transitions rather than guessing; never move to Done/Closed or reassign unprompted.
