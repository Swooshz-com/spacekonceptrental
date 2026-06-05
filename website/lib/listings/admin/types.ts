import "server-only";

import type {
  ProductPersistence,
  TrustedProductAdminContext
} from "../../products/persistence";

export type TrustedRentalListingAdminContext = TrustedProductAdminContext;

export type RentalListingStatus = "draft" | "active" | "archived";

export type RentalListingDraft = {
  categoryId?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  details?: string;
  rentalUnit?: string;
  status: RentalListingStatus;
  sortOrder?: number;
};

export type RentalListingUpdate = Partial<RentalListingDraft>;

export type ListingImageMetadataDraft = {
  listingId: string;
  storageBucket: string;
  storagePath: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type ListingImageMetadataUpdate = Partial<
  Omit<ListingImageMetadataDraft, "listingId">
>;

export type RentalListingAdminRecordType = "listing" | "listingImage";

export type RentalListingAdminRecord = {
  id: string;
  type: RentalListingAdminRecordType;
};

export type RentalListingAdminRejectReason =
  | "input_invalid"
  | "payload_unsafe"
  | "admin_context_invalid"
  | "listing_id_invalid"
  | "image_id_invalid"
  | "category_id_invalid"
  | "slug_invalid"
  | "title_invalid"
  | "short_description_invalid"
  | "details_invalid"
  | "rental_unit_invalid"
  | "status_invalid"
  | "sort_order_invalid"
  | "storage_bucket_invalid"
  | "storage_path_invalid"
  | "alt_text_invalid";

export type RentalListingAdminResult =
  | {
      ok: true;
      record: RentalListingAdminRecord;
    }
  | {
      ok: false;
      status: "rejected";
      reason: RentalListingAdminRejectReason;
    }
  | {
      ok: false;
      status: "unavailable";
      reason: "listing_admin_unavailable";
    };

export type CreateRentalListingInput = {
  admin: TrustedRentalListingAdminContext;
  listing: RentalListingDraft;
};

export type UpdateRentalListingInput = {
  admin: TrustedRentalListingAdminContext;
  listingId: string;
  updates: RentalListingUpdate;
};

export type ArchiveRentalListingInput = {
  admin: TrustedRentalListingAdminContext;
  listingId: string;
};

export type CreateListingImageMetadataInput = {
  admin: TrustedRentalListingAdminContext;
  image: ListingImageMetadataDraft;
};

export type UpdateListingImageMetadataInput = {
  admin: TrustedRentalListingAdminContext;
  imageId: string;
  updates: ListingImageMetadataUpdate;
};

export type ArchiveListingImageMetadataInput = {
  admin: TrustedRentalListingAdminContext;
  imageId: string;
};

export type ProductBackedRentalListingAdminDependencies = {
  persistence?: ProductPersistence;
};

export interface RentalListingAdminAdapter {
  createListing: (
    input: CreateRentalListingInput
  ) => Promise<RentalListingAdminResult>;
  updateListing: (
    input: UpdateRentalListingInput
  ) => Promise<RentalListingAdminResult>;
  archiveListing: (
    input: ArchiveRentalListingInput
  ) => Promise<RentalListingAdminResult>;
  createListingImage: (
    input: CreateListingImageMetadataInput
  ) => Promise<RentalListingAdminResult>;
  updateListingImage: (
    input: UpdateListingImageMetadataInput
  ) => Promise<RentalListingAdminResult>;
  archiveListingImage: (
    input: ArchiveListingImageMetadataInput
  ) => Promise<RentalListingAdminResult>;
}
