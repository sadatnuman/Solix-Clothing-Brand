"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api, { errorMessage } from "../../lib/api";

const fallback = {
  about: ["About Solix", "Solix is a Rajbari clothing store built around considered style, clear sizing and personal local service."],
  faq: ["Frequently asked questions", "Quick answers for shopping, payment, delivery and aftercare."],
  "size-guide": ["Find your Solix size", "Use body measurements as your starting point, then check the fit note on each product."],
  delivery: ["Delivery, made clear", "See how confirmation, dispatch and tracking work before you order."],
  returns: ["Returns & size exchanges", "Request eligible aftercare directly from your order page."],
  privacy: ["Privacy", "We use account and order information only to operate this store and provide support."],
  terms: ["Store terms", "Orders are subject to stock validation. Manual Send Money transfers require verification before fulfilment."],
};

const guides = {
  faq: {
    label: "HELP / QUICK ANSWERS",
    items: [
      ["How do I place an order?", "Choose a colour and available size, add the item to your bag, sign in, select a delivery address and complete checkout."],
      ["Which payment methods are available?", "Choose Cash on Delivery or send money manually through bKash or Nagad. Send Money orders move forward after the transaction reference is verified."],
      ["Can I order without an account?", "You can browse and build a guest bag. Sign in or create an account before checkout so you can follow payment and delivery updates."],
      ["How do I check stock?", "Every product page shows stock for the selected size and colour. Stock is checked again securely during checkout."],
      ["Where can I track my order?", "Open Your Solix, choose Track orders, then select an order to view its status timeline, payment and courier details."],
      ["How do I contact Solix?", "Use the website Support inbox for an order or product question, or visit and call the Rajbari store from the Contact page."],
    ],
    action: ["Still need help?", "Open support inbox", "/support"],
  },
  "size-guide": {
    label: "HELP / FIT",
    sizes: [
      ["XS", "32–34", "26–28", "34–36"], ["S", "35–37", "29–31", "37–39"],
      ["M", "38–40", "32–34", "40–42"], ["L", "41–43", "35–37", "43–45"],
      ["XL", "44–46", "38–40", "46–48"], ["XXL", "47–49", "41–43", "49–51"],
    ],
    notes: [
      ["Measure", "Use a soft tape over light clothing. Keep it level and comfortably close to the body."],
      ["Compare", "Use the largest relevant body measurement. Product-specific measurements and fit notes take priority."],
      ["Choose", "Between two sizes? Choose the larger size for an easy fit or contact support before ordering."],
    ],
    action: ["Ready to find your fit?", "Browse the collection", "/shop"],
  },
  delivery: {
    label: "HELP / DELIVERY",
    steps: [
      ["01", "Order received", "Your items, delivery address and selected payment method are saved securely."],
      ["02", "Payment review", "COD orders continue normally. bKash and Nagad references are checked by the Solix team."],
      ["03", "Packed & dispatched", "Your order timeline updates when the pieces are prepared and handed to the courier."],
      ["04", "Delivered", "Use Track orders for the latest status and any available courier reference."],
    ],
    facts: ["Complimentary delivery is currently BDT 0", "Delivery timing depends on destination and order confirmation", "A complete address and reachable phone number are required"],
    action: ["Already placed an order?", "Track your order", "/orders"],
  },
  returns: {
    label: "HELP / AFTERCARE",
    steps: [
      ["01", "Open the delivered order", "Go to Track orders and select the item that needs attention."],
      ["02", "Submit your request", "Choose return or size exchange, add the reason and include the requested details."],
      ["03", "Wait for review", "The Solix team checks eligibility and replies through your account notification centre."],
      ["04", "Complete aftercare", "Approved stock and order changes are recorded when the return or exchange is completed."],
    ],
    facts: ["Keep the item unused and in its original condition", "Approval depends on order status, item condition and available replacement stock", "Submitting a request does not automatically approve it"],
    action: ["Need aftercare?", "View your orders", "/orders"],
  },
};

function Guide({ slug }) {
  const guide = guides[slug];
  if (!guide) return null;
  return <>
    {guide.items && <div className="faq-list">{guide.items.map(([question, answer]) => <details key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div>}
    {guide.sizes && <div className="size-guide-wrap"><table className="size-guide-table"><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Hip</th></tr></thead><tbody>{guide.sizes.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}{cell !== row[0] && "″"}</td>)}</tr>)}</tbody></table><p>Body measurements in inches. Always read the individual product fit note.</p></div>}
    {(guide.steps || guide.notes) && <div className="help-card-grid">{(guide.steps || guide.notes).map(([number, title, body], index) => <article key={title || number}><span>{guide.steps ? number : `0${index + 1}`}</span><h2>{guide.steps ? title : number}</h2><p>{guide.steps ? body : title}</p></article>)}</div>}
    {guide.facts && <section className="help-facts"><h2>Good to know.</h2><ul>{guide.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>}
    <aside className="help-action"><div><span className="eyebrow">NEXT STEP</span><h2>{guide.action[0]}</h2></div><Link className="button dark" href={guide.action[2]}>{guide.action[1]} <span>↗</span></Link></aside>
  </>;
}

export default function ContentPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`/content/${slug}`).then((response) => setPage(response.data.data)).catch((requestError) => {
      const copy = fallback[slug];
      if (copy) setPage({ title: copy[0], body: copy[1] });
      else setError(errorMessage(requestError));
    });
  }, [slug]);
  const guide = guides[slug];
  return <main className={`section content-page ${guide ? "help-page" : ""}`}>
    <span className="eyebrow">{guide?.label || "SOLIX / INFORMATION"}</span>
    {error ? <div className="empty-state">{error}</div> : page ? <><header className="help-heading"><h1>{page.title}</h1><p>{String(page.body || "").split("\n")[0]}</p></header><Guide slug={slug} /></> : <div className="skeleton detail-loading" />}
  </main>;
}
