"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/catalog/service-card";
import { categories, filterServices } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n/config";
import { copyFor } from "@/lib/product-copy";

export function ServiceDirectory({
  locale,
  categorySlug = "",
}: {
  locale: Locale;
  categorySlug?: string;
}) {
  const copy = copyFor(locale);
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categorySlug);
  const results = filterServices(query, category);
  return (
    <div>
      <div className="directory-filters">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-search`} className="type-label">
            {copy.search}
          </label>
          <Input
            id={`${id}-search`}
            value={query}
            maxLength={500}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-help`}
            className="mt-2 bg-card"
            onChange={(event) => setQuery(event.target.value)}
          />
          <p id={`${id}-help`} className="type-helper mt-2">
            {copy.searchHelp}
          </p>
        </div>
        <div className="min-w-0">
          <label className="type-label" htmlFor={`${id}-category`}>
            {copy.filter}
          </label>
          <select
            className="native-select mt-2 block w-full"
            id={`${id}-category`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name[locale]}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setQuery("");
            setCategory("");
          }}
        >
          {copy.clearFilters}
        </Button>
      </div>
      <p role="status" className="my-5 text-sm text-muted-foreground">
        {new Intl.NumberFormat(locale).format(results.length)} {copy.count}
      </p>
      {results.length ? (
        <div className="directory-grid">
          {results.map((service) => (
            <ServiceCard
              key={service.slug}
              service={service}
              locale={locale}
              headingLevel={2}
            />
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2 className="text-xl font-semibold">{copy.noResults}</h2>
          <p>{copy.topicNotice}</p>
        </div>
      )}
      <nav className="mt-8 flex flex-wrap gap-5" aria-label={copy.directory}>
        <Link className="text-link" href={`/${locale}/categories`}>
          {copy.categories}
        </Link>
        <Link className="text-link" href={`/${locale}/agencies`}>
          {copy.agencies}
        </Link>
        <Link className="text-link" href={`/${locale}/sources`}>
          {copy.sources}
        </Link>
      </nav>
    </div>
  );
}
