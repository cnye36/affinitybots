"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/useToast"
import { createClient } from "@/supabase/client"

export function FeedbackButton() {
const [open, setOpen] = useState(false)
const [email, setEmail] = useState("")
const [name, setName] = useState("")
const [subject, setSubject] = useState("")
const [message, setMessage] = useState("")
const [isSubmitting, setIsSubmitting] = useState(false)

useEffect(() => {
// Prefill from authenticated user if available
;(async () => {
try { 
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (user) {
const profileRes = await supabase
.from("profiles")
.select("name, email")
.eq("id", user.id)
.single()
const displayName = profileRes.data?.name || user.user_metadata?.full_name || user.user_metadata?.name || ""
const displayEmail = profileRes.data?.email || user.email || ""
setName((n) => n || displayName)
setEmail((e) => e || displayEmail)
}
} catch (err) {
// no-op
}
})()
}, [])

const canSubmit = useMemo(() => message.trim().length > 0 && !isSubmitting, [message, isSubmitting])

async function handleSubmit(e: React.FormEvent) {
e.preventDefault()
if (!canSubmit) return
setIsSubmitting(true)
try {
const res = await fetch("/api/feedback", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email: email || undefined, name: name || undefined, subject: subject || undefined, message }),
})
if (!res.ok) {
const data = await res.json().catch(() => ({}))
throw new Error(data.error || "Failed to send feedback")
}
toast({ title: "Thanks!", description: "Your feedback was sent." })
setOpen(false)
setSubject("")
setMessage("")
} catch (err: any) {
toast({ title: "Could not send feedback", description: err?.message || "Please try again.", variant: "destructive" })
} finally {
setIsSubmitting(false)
}
}

return (
<Dialog open={open} onOpenChange={setOpen}>
<DialogTrigger asChild>
<Button variant="ghost" size="sm" className="w-full justify-start">
<MessageSquare className="h-4 w-4 mr-2" />
Feedback
</Button>
</DialogTrigger>
<DialogContent className="sm:max-w-lg">
<DialogHeader>
<DialogTitle>Send Feedback</DialogTitle>
<DialogDescription>We read every message. Thanks for helping us improve.</DialogDescription>
</DialogHeader>
<form onSubmit={handleSubmit} className="space-y-4">
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="feedback-name">Name</Label>
<Input id="feedback-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" />
</div>
<div className="space-y-2">
<Label htmlFor="feedback-email">Email</Label>
<Input id="feedback-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com (optional)" />
</div>
</div>
<div className="space-y-2">
<Label htmlFor="feedback-subject">Subject</Label>
<Input id="feedback-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary (optional)" />
</div>
<div className="space-y-2">
<Label htmlFor="feedback-message">Feedback</Label>
<Textarea id="feedback-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What’s working? What’s not? What would you like to see?" rows={6} />
</div>
<div className="flex justify-end gap-2">
<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
<Button type="submit" disabled={!canSubmit}>{isSubmitting ? "Sending..." : "Send"}</Button>
</div>
</form>
</DialogContent>
</Dialog>
)
}

export default FeedbackButton


