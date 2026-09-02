import React from "react";
import { Categories } from "@/lib/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export default function CategoriesManager() {
  return (
    <TaxonomyManager
      collection={Categories}
      collectionName="categories"
      titleKey="cm_title"
      newKey="cm_new"
      emptyKey="om_empty"
    />
  );
}
