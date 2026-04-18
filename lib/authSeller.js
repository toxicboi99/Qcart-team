import { isVendorRole } from "@/lib/server/vendor";

const authSeller = async (user) => {
  return Boolean(user && (isVendorRole(user.role) || user.isVendor));
};

export default authSeller;
