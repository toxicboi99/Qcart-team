import { isAdminRole } from "@/lib/server/vendor";

const authAdmin = async (user) => {
  return Boolean(user && isAdminRole(user.role));
};

export default authAdmin;
