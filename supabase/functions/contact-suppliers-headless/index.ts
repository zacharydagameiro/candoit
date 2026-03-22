import { createClient } from "npm:@supabase/supabase-js@2.57.4"
import { chromium } from "npm:playwright-core@1.54.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type OutreachQueueRow = {
  id: string
  requirement_id: string
  supplier_id: string
  match_status: "candidate" | "shortlisted" | "rejected"
  outreach_state: "pending" | "ready" | "contacting" | "contacted" | "failed"
  outreach_attempts: number
}

type SupplierRow = {
  id: string
  name: string
  contact_url: string | null
}

type RequirementRow = {
  id: string
  title: string
}

type FillPayload = {
  subject: string
  message: string
  senderName: string
  senderEmail: string
  companyName?: string
  phone?: string
}

function buildPayload(input: {
  supplierName: string
  requirementTitle: string
}): FillPayload {
  const senderName = Deno.env.get("OUTREACH_SENDER_NAME") ?? "Sourcing Team"
  const senderEmail =
    Deno.env.get("OUTREACH_SENDER_EMAIL") ?? "sourcing@example.com"
  const companyName = Deno.env.get("OUTREACH_COMPANY_NAME") ?? undefined
  const phone = Deno.env.get("OUTREACH_PHONE") ?? undefined

  const subjectTemplate =
    Deno.env.get("OUTREACH_SUBJECT_TEMPLATE") ??
    "Supplier inquiry for {{requirement_title}}"
  const messageTemplate =
    Deno.env.get("OUTREACH_MESSAGE_TEMPLATE") ??
    "Hi {{supplier_name}}, we are sourcing for {{requirement_title}}. Please share availability, pricing, and next steps."

  const subject = subjectTemplate
    .replaceAll("{{supplier_name}}", input.supplierName)
    .replaceAll("{{requirement_title}}", input.requirementTitle)
  const message = messageTemplate
    .replaceAll("{{supplier_name}}", input.supplierName)
    .replaceAll("{{requirement_title}}", input.requirementTitle)

  return {
    subject,
    message,
    senderName,
    senderEmail,
    companyName,
    phone,
  }
}

async function fillFirst(
  scope: any,
  selectors: string[],
  value: string | undefined
): Promise<boolean> {
  if (!value) {
    return false
  }

  for (const selector of selectors) {
    const target = scope.locator(selector)
    if ((await target.count()) > 0) {
      await target.first().fill(value)
      return true
    }
  }

  return false
}

async function submitSupplierContactForm(args: {
  page: any
  contactUrl: string
  payload: FillPayload
}): Promise<{ submitted: boolean; message: string }> {
  const { page, contactUrl, payload } = args
  await page.goto(contactUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  })

  const form = page.locator("form").first()
  if ((await form.count()) === 0) {
    return {
      submitted: false,
      message: "No form found on contact page.",
    }
  }

  await fillFirst(
    form,
    [
      'input[name*="name" i]',
      'input[id*="name" i]',
      'input[placeholder*="name" i]',
      'input[autocomplete="name"]',
    ],
    payload.senderName
  )
  await fillFirst(
    form,
    [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[placeholder*="email" i]',
      'input[autocomplete="email"]',
    ],
    payload.senderEmail
  )
  await fillFirst(
    form,
    [
      'input[name*="company" i]',
      'input[id*="company" i]',
      'input[placeholder*="company" i]',
      'input[autocomplete="organization"]',
    ],
    payload.companyName
  )
  await fillFirst(
    form,
    [
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[placeholder*="phone" i]',
      'input[autocomplete="tel"]',
    ],
    payload.phone
  )
  await fillFirst(
    form,
    [
      'input[name*="subject" i]',
      'input[id*="subject" i]',
      'input[placeholder*="subject" i]',
    ],
    payload.subject
  )

  const messageFilled = await fillFirst(
    form,
    [
      'textarea[name*="message" i]',
      'textarea[id*="message" i]',
      'textarea[placeholder*="message" i]',
      'textarea[name*="details" i]',
      'textarea[id*="details" i]',
      "textarea",
      'input[name*="message" i]',
      'input[id*="message" i]',
      'input[name*="details" i]',
      'input[id*="details" i]',
    ],
    payload.message
  )

  if (!messageFilled) {
    return {
      submitted: false,
      message: "Could not find a message/details field to fill.",
    }
  }

  const submitButton = form
    .locator(
      'button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Submit"), button:has-text("Contact"), button:has-text("Request")'
    )
    .first()

  if ((await submitButton.count()) === 0) {
    return {
      submitted: false,
      message: "Could not find a submit button.",
    }
  }

  await submitButton.click({ timeout: 10000 })
  await page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => undefined)
  await page.waitForTimeout(1250)

  return {
    submitted: true,
    message: "Submitted contact form.",
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const browserWsEndpoint = Deno.env.get("BROWSER_WS_ENDPOINT")

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  if (!browserWsEndpoint) {
    return new Response(
      JSON.stringify({
        error: "Missing BROWSER_WS_ENDPOINT.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: queueRowsData, error: queueRowsError } = await supabase
    .from("requirement_suppliers")
    .select(
      "id, requirement_id, supplier_id, match_status, outreach_state, outreach_attempts"
    )
    .eq("match_status", "shortlisted")
    .eq("outreach_state", "ready")
    .order("updated_at", { ascending: true })
    .limit(25)

  if (queueRowsError) {
    return new Response(
      JSON.stringify({
        error: queueRowsError.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const queueRows = (queueRowsData as OutreachQueueRow[] | null) ?? []
  if (!queueRows.length) {
    return new Response(
      JSON.stringify({
        success: true,
        noWork: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const nowIso = new Date().toISOString()

  let claimed: OutreachQueueRow | null = null
  for (const row of queueRows) {
    const { data: claimedRow, error: claimError } = await supabase
      .from("requirement_suppliers")
      .update({
        outreach_state: "contacting",
        outreach_claimed_at: nowIso,
        outreach_last_attempted_at: nowIso,
        outreach_attempts: (row.outreach_attempts ?? 0) + 1,
        outreach_last_error: null,
      })
      .eq("id", row.id)
      .eq("outreach_state", "ready")
      .select(
        "id, requirement_id, supplier_id, match_status, outreach_state, outreach_attempts"
      )
      .maybeSingle()

    if (claimError) {
      continue
    }

    if (claimedRow) {
      claimed = claimedRow as OutreachQueueRow
      break
    }
  }

  if (!claimed) {
    return new Response(
      JSON.stringify({
        success: true,
        noWork: true,
        message: "No row could be claimed.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const [{ data: supplierData, error: supplierError }, { data: requirementData, error: requirementError }] =
    await Promise.all([
      supabase
        .from("suppliers")
        .select("id, name, contact_url")
        .eq("id", claimed.supplier_id)
        .maybeSingle(),
      supabase
        .from("requirements")
        .select("id, title")
        .eq("id", claimed.requirement_id)
        .maybeSingle(),
    ])

  if (supplierError || !supplierData) {
    await supabase
      .from("requirement_suppliers")
      .update({
        outreach_state: "failed",
        outreach_last_error: supplierError?.message ?? "Supplier not found.",
      })
      .eq("id", claimed.id)

    return new Response(
      JSON.stringify({
        success: false,
        linkId: claimed.id,
        error: supplierError?.message ?? "Supplier not found.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  if (requirementError || !requirementData) {
    await supabase
      .from("requirement_suppliers")
      .update({
        outreach_state: "failed",
        outreach_last_error: requirementError?.message ?? "Requirement not found.",
      })
      .eq("id", claimed.id)

    return new Response(
      JSON.stringify({
        success: false,
        linkId: claimed.id,
        error: requirementError?.message ?? "Requirement not found.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const supplier = supplierData as SupplierRow
  const requirement = requirementData as RequirementRow

  if (!supplier.contact_url) {
    await supabase
      .from("requirement_suppliers")
      .update({
        outreach_state: "failed",
        outreach_last_error: "No contact URL on supplier record.",
      })
      .eq("id", claimed.id)

    return new Response(
      JSON.stringify({
        success: false,
        linkId: claimed.id,
        supplierId: supplier.id,
        error: "No contact URL on supplier record.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }

  const payload = buildPayload({
    supplierName: supplier.name,
    requirementTitle: requirement.title,
  })

  const browser = await chromium.connectOverCDP(browserWsEndpoint)
  const context = browser.contexts()[0] ?? (await browser.newContext())

  try {
    const page = await context.newPage()
    try {
      const submission = await submitSupplierContactForm({
        page,
        contactUrl: supplier.contact_url,
        payload,
      })

      if (submission.submitted) {
        await supabase
          .from("requirement_suppliers")
          .update({
            outreach_state: "contacted",
            outreach_contacted_at: new Date().toISOString(),
            outreach_last_error: null,
          })
          .eq("id", claimed.id)
      } else {
        await supabase
          .from("requirement_suppliers")
          .update({
            outreach_state: "failed",
            outreach_last_error: submission.message,
          })
          .eq("id", claimed.id)
      }

      return new Response(
        JSON.stringify({
          success: submission.submitted,
          linkId: claimed.id,
          supplierId: supplier.id,
          supplierName: supplier.name,
          message: submission.message,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Contact submission failed."

      await supabase
        .from("requirement_suppliers")
        .update({
          outreach_state: "failed",
          outreach_last_error: errorMessage,
        })
        .eq("id", claimed.id)

      return new Response(
        JSON.stringify({
          success: false,
          linkId: claimed.id,
          supplierId: supplier.id,
          supplierName: supplier.name,
          error: errorMessage,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    } finally {
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
  }
})
