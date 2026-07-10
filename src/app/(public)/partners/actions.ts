"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function submitLead(input: {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const company = input.company.trim();
  const contactName = input.contactName.trim();
  const email = input.email.trim();
  if (!company || !contactName || !email) {
    return { ok: false, error: "Company, contact name, and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("b2b_leads").insert({
    company,
    contact_name: contactName,
    email,
    phone: input.phone.trim() || null,
    message: input.message.trim() || null,
  });
  if (error) return { ok: false, error: "Something went wrong — try again." };

  // Sales notification; dormant until RESEND_API_KEY + SALES_EMAIL are set.
  const salesEmail = process.env.SALES_EMAIL;
  if (salesEmail) {
    await sendEmail({
      to: salesEmail,
      subject: `New B2B lead: ${company}`,
      text: [
        `Company: ${company}`,
        `Contact: ${contactName}`,
        `Email: ${email}`,
        ...(input.phone.trim() ? [`Phone: ${input.phone.trim()}`] : []),
        ...(input.message.trim() ? [``, input.message.trim()] : []),
      ].join("\n"),
    });
  }

  return { ok: true };
}
