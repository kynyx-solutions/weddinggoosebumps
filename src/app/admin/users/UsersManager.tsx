"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROLES, ROLE_DESCRIPTIONS } from "@/lib/permissions";

import { toast } from "@/components/admin/toast";
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  addedLabel: string;
  locked: boolean;
}

const selectClass = "h-9 rounded-md border border-slate-200 bg-white px-2 text-sm";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Something went wrong, please try again");
  return data;
}

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Editor" });
  const [passwordFor, setPasswordFor] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = await send("/api/users", "POST", form);
      setUsers((current) => [...current, { ...user, name: user.name ?? "", addedLabel: "Today", locked: false }]);
      setAdding(false);
      setForm({ name: "", email: "", password: "", role: "Editor" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the user");
    }
  };

  const changeRole = async (user: UserRow, role: string) => {
    try {
      await send(`/api/users/${user.id}`, "PUT", { role });
      setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, role } : u)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't change the role");
    }
  };

  const setPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordFor) return;
    setError("");
    try {
      await send(`/api/users/${passwordFor.id}`, "PUT", { password: newPassword });
      setUsers((current) => current.map((u) => (u.id === passwordFor.id ? { ...u, locked: false } : u)));
      setPasswordFor(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set the password");
    }
  };

  const remove = async (user: UserRow) => {
    if (!confirm(`Remove ${user.email}? They won't be able to sign in any more.`)) return;
    try {
      await send(`/api/users/${user.id}`, "DELETE");
      setUsers((current) => current.filter((u) => u.id !== user.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't remove the user");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            Who can sign in to this panel, and what each person may change.
          </p>
        </div>
        <Button onClick={() => { setAdding(true); setError(""); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
          {ROLES.map((role) => (
            <p key={role}>
              <span className="font-medium">{role}:</span>{" "}
              <span className="text-gray-600">{ROLE_DESCRIPTIONS[role]}</span>
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-900">Name</th>
                <th className="px-6 py-4 font-medium text-gray-900">Email</th>
                <th className="px-6 py-4 font-medium text-gray-900">Role</th>
                <th className="px-6 py-4 font-medium text-gray-900">Added</th>
                <th className="px-6 py-4 text-right font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.name || "-"}
                    {user.id === currentUserId && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                    {user.locked && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700" title="Too many wrong passwords; setting a new password unlocks it">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className={selectClass}
                      value={user.role}
                      aria-label={`Role for ${user.email}`}
                      onChange={(e) => changeRole(user, e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.addedLabel}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => { setPasswordFor(user); setNewPassword(""); setError(""); }}>
                      <KeyRound className="mr-1 h-4 w-4" />
                      Set password
                    </Button>
                    {user.id !== currentUserId && (
                      <Button variant="outline" size="sm" onClick={() => remove(user)} title="Remove">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={adding} onOpenChange={setAdding}>
        {/* bg-white: the dialog's default bg-background colour isn't defined in this theme */}
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Share the email and password with them; they can change the password later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="text" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-gray-500">At least 8 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" className={`${selectClass} h-10 w-full`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[form.role]}</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit">Add user</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordFor !== null} onOpenChange={(open) => !open && setPasswordFor(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New password for {passwordFor?.email}</DialogTitle>
            <DialogDescription>This also unlocks the account if it was locked.</DialogDescription>
          </DialogHeader>
          <form onSubmit={setPassword} className="space-y-4">
            <Input type="text" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPasswordFor(null)}>Cancel</Button>
              <Button type="submit">Set password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
