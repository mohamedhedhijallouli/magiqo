import React from "react";
import { CardUniverses } from "@/lib/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export default function CardUniversesManager() {
  return (
    <TaxonomyManager
      collection={CardUniverses}
      collectionName="card_universes"
      titleKey="cum_title"
      newKey="cum_new"
      emptyKey="cum_empty"
    />
  );
}
