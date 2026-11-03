# Invitation lifecycle

Concord intentionally sends no email. A workspace owner creates an
invitation from the **Members** UI, receives a one-time link, and gives it
to the intended person over a trusted channel. The link is a bearer
credential: do not paste it into public issues, logs, or screenshots.

## Flow

1. An owner invites an email address and optionally chooses `owner`
   rather than the default `member` role.
2. Concord stores a hash of the token in the central control database.
   The raw token appears only in the returned link and cannot be retrieved
   later. The invitation expires after **seven days**.
3. The recipient opens the link. If they already have an account, they must
   first authenticate as the *invited email*. Being signed in as someone
   else does not authorize acceptance.
4. A new recipient supplies a name and password, or signs in through
   Google with a verified, matching email when Google is configured.
5. Acceptance adds the recipient to that workspace with the invited role
   and consumes the link. Someone who already belongs to the workspace
   cannot be reinvited.

```
Owner creates link
        |
        v
Pending (up to 7 days) ---> replaced by new invite / owner withdraws
        |
        +--> expired (no access)
        |
        +--> accepted by matching identity --> membership with invited role
```

## State and next action

| State | Link response | What to do |
| --- | --- | --- |
| Pending and unexpired | Lookup describes workspace, invited email and role | Sign in as the invited email or create the matching account |
| Accepted | Previously used token no longer validates | Sign in normally and choose the workspace |
| Expired | Lookup/accept rejects the invalid link | Ask an owner for a new link |
| Withdrawn | Lookup/accept rejects the invalid link | Ask an owner for a new link |
| Replaced | Old link becomes invalid, newest link remains usable | Use the replacement link |

Creating a new pending invitation for the same workspace/email removes the
previous pending one. The 100-pending-invitation default per workspace is
configurable with `CONCORD_MAX_INVITES`.

**Security:** neither possession of another user's existing session nor
knowledge of their email replaces authentication. Owner-role invitations
really grant owner powers; verify the email and role before distributing
the link.

Source: `services/api/src/auth.ts` (createInvite, pendingInvite,
acceptInvite, admit), `services/api/src/auth-api.ts` and
`services/api/test/tenancy.test.ts`.
