import { useEffect } from "react";

type Meta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
};

function setMetaTag(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({ title, description, ogTitle, ogDescription }: Meta) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMetaTag('meta[name="description"]', "name", "description", description);
    if (ogTitle) setMetaTag('meta[property="og:title"]', "property", "og:title", ogTitle);
    if (ogDescription)
      setMetaTag('meta[property="og:description"]', "property", "og:description", ogDescription);
  }, [title, description, ogTitle, ogDescription]);
}
