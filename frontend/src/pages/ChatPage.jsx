import Sidebar from "../components/chat/Sidebar";
import WorkspaceHeader from "../components/chat/WorkspaceHeader";
import PromptRibbon from "../components/chat/PromptRibbon";
import MessagePanel from "../components/chat/MessagePanel";
import Composer from "../components/chat/Composer";
import { projectExamples } from "../constants/appData";
import ScraperPage from "./ScraperPage";
import AuditPage from "./AuditPage";
import BillingPage from "./BillingPage";
import CodePlaygroundPage from "./CodePlaygroundPage";

function ChatPage(props) {
  const hasStartedConversation = Boolean(props.activeChat?.chat?.messages?.length);
  const showChatWorkspace = props.routeType === "auth";

  return (
    <div className="app-frame">
      <div className="app-shell">
        <Sidebar
          onNavigateTool={props.onNavigateTool}
          routeType={props.routeType}
          activeChatId={props.activeChatId}
          history={props.history}
          historySearch={props.historySearch}
          onBeginRename={props.onBeginRename}
          onCommitRename={props.onCommitRename}
          onDeleteChat={props.onDeleteChat}
          onHistorySearchChange={props.onHistorySearchChange}
          onLogout={props.onLogout}
          onNewChat={props.onNewChat}
          onOpenChat={props.onOpenChat}
          onRenameValueChange={props.onRenameValueChange}
          renameValue={props.renameValue}
          renamingChatId={props.renamingChatId}
          sessionUser={props.sessionUser}
          statusLine={props.statusLine}
        />

        <main className="workspace">
          {showChatWorkspace ? (
            <>
              <WorkspaceHeader
                canShare={Boolean(props.activeChatId && !props.isDraftChat)}
                onShareChat={props.onShareChat}
              />

              {!hasStartedConversation ? (
                <PromptRibbon examples={projectExamples} onExampleClick={props.onExampleClick} onToggle={props.onTogglePrompts} promptsOpen={props.promptsOpen} />
              ) : null}

              {props.appError ? <p className="notice error">{props.appError}</p> : null}
              {props.shareNotice ? <p className="notice success">{props.shareNotice}</p> : null}

              <MessagePanel
                activeChat={props.activeChat}
                editValue={props.editValue}
                editingMessageId={props.editingMessageId}
                messagePanelRef={props.messagePanelRef}
                onBeginEdit={props.onBeginEdit}
                onCommitEdit={props.onCommitEdit}
                onEditValueChange={props.onEditValueChange}
                typingTarget={props.typingTarget}
                typingVisible={props.typingVisible}
              />

              {props.activeChat?.searchResults?.length ? (
                <section className="search-results">
                  <p className="eyebrow">Matches in this thread</p>
                  <div className="match-grid">
                    {props.activeChat.searchResults.map((match) => (
                      <div className="match-card" key={match.messageId}>
                        <strong>{match.role}</strong>
                        <p>{match.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <Composer
                isSubmitting={props.isSubmitting}
                onClearFile={() => props.onFileChange(null)}
                onFileChange={props.onFileChange}
                onKeyDown={props.onKeyDown}
                onPaste={props.onPaste}
                onQuestionChange={props.onQuestionChange}
                onSubmit={props.onSubmit}
                question={props.question}
                selectedFile={props.selectedFile}
              />
            </>
          ) : null}

          {props.routeType === "billing" ? (
            <BillingPage api={props.api} onRefreshSession={props.onRefreshSession} sessionUser={props.sessionUser} />
          ) : null}
          {props.routeType === "playground" ? <CodePlaygroundPage /> : null}
          {props.routeType === "scraper" ? <ScraperPage onScrape={props.onScrape} /> : null}
          {props.routeType === "audit" ? <AuditPage onAudit={props.onAudit} /> : null}
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
