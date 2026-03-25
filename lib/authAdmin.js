const authAdmin = async (user) => {
  return Boolean(user && (user.role === "admin" || user.role === "seller"));
};

export default authAdmin;
