<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the admin article backup client-side using authenticated, paginated article reads; this preserves RLS and avoids presenting a content export as a full database or storage backup.
- Apply admin pagination after filtering through the shared pagination helper and keep the selected page in URL search state; this keeps filters consistent and preserves the page on reload.
