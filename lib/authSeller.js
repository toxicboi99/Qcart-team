const authSeller = async (user) => {
  return Boolean(user && (user.role === "seller" || user.role === "admin"));
};

export default authSeller;
