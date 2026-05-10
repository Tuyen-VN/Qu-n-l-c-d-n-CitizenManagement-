import axios from "../utils/axios-customize";

const loginUserAPI = (username, password) => {
  const URL_BACKEND = "/api/auth/login";
  const data = {
    username: username,
    password: password,
    // delay: 2000,
  };
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const callFetchAccount = () => {
  const URL_BACKEND = "/api/auth/me";
  return axios.get(URL_BACKEND);
};
const callUserById = (id) => {
  const URL_BACKEND = `/api/users/${id}`;
  return axios.get(URL_BACKEND);
};
const callChangePassword = (data) => {
  const URL_BACKEND = `/api/auth/change-password`;
  return axios.post(URL_BACKEND, data);
};
const callLogout = () => {
  const URL_BACKEND = "/api/auth/logout";
  return axios.post(URL_BACKEND);
};

const callListCitizensAPI = (query) => {
  const URL_BACKEND = `api/citizens?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callListWardAPI = () => {
  const URL_BACKEND = `api/wards`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const createCitizenAPI = (data) => {
  const URL_BACKEND = "/api/citizens";
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const updateCitizenAPI = (id, data) => {
  const URL_BACKEND = `/api/citizens/${id}`;

  const res = axios.put(URL_BACKEND, data);
  return res;
};

const deleteCitizenAPI = (id) => {
  const URL_BACKEND = `api/citizens/${id}`;
  const res = axios.delete(URL_BACKEND);
  return res;
};

const callListHouseholdAPI = (query) => {
  const URL_BACKEND = `api/households?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};

const callHouseholdAPI = (id) => {
  const URL_BACKEND = `api/households/${id}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callHouseholdMembersdAPI = (id) => {
  const URL_BACKEND = `api/households/${id}/members`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const createHouseholdAPI = (data) => {
  const URL_BACKEND = "/api/households";
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const addHouseholdMemberAPI = (householdId, data) => {
  const URL_BACKEND = `api/households/${householdId}/members`;
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const deleteHouseholdMemberAPI = (id, citizensId) => {
  const URL_BACKEND = `api/households/${id}/members/${citizensId}`;
  const res = axios.delete(URL_BACKEND);
  return res;
};
const updateHouseholdAPI = (id, data) => {
  const URL_BACKEND = `api/households/${id}`;
  const res = axios.put(URL_BACKEND, data);
  return res;
};
const deleteHouseholdAPI = (id) => {
  const URL_BACKEND = `api/households/${id}`;
  const res = axios.delete(URL_BACKEND);
  return res;
};

const callListTemporaryResidencesAPI = (query) => {
  const URL_BACKEND = `api/temporary-residences?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const createTemporaryResidencesAPI = (data) => {
  const URL_BACKEND = `api/temporary-residences`;
  const res = axios.post(URL_BACKEND, data);
  return res;
};

const callListTemporaryAbsencesAPI = (query) => {
  const URL_BACKEND = `api/temporary-absences?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const createTemporaryAbsencesAPI = (data) => {
  const URL_BACKEND = `api/temporary-absences`;
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const callListUserAPI = (query) => {
  const URL_BACKEND = `/api/v1/user?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};

const createUserAPI = (fullName, email, password, phone) => {
  const URL_BACKEND = "/api/v1/user";
  const data = {
    fullName: fullName,
    email: email,
    password: password,
    phone: phone,
  };
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const callBulkCreateUser = (data) => {
  const URL_BACKEND = "/api/v1/user/bulk-create";
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const deleteUserAPI = (id) => {
  const URL_BACKEND = `/api/v1/user/${id}`;
  const res = axios.delete(URL_BACKEND);
  return res;
};
const editUserAPI = (id, fullName, phone) => {
  const URL_BACKEND = `/api/v1/user/`;
  const data = {
    _id: id,
    fullName,
    phone,
  };
  const res = axios.put(URL_BACKEND, data);
  return res;
};
const callListBookAPI = (query) => {
  const URL_BACKEND = `/api/v1/book?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callListCategoryAPI = () => {
  const URL_BACKEND = "/api/v1/database/category";
  const res = axios.get(URL_BACKEND);
  return res;
};
const callUploadBookImg = (fileImg) => {
  const bodyFormData = new FormData();
  bodyFormData.append("fileImg", fileImg);
  return axios({
    method: "post",
    url: "/api/v1/file/upload",
    data: bodyFormData,
    headers: {
      "Content-Type": "multipart/form-data",
      "upload-type": "book",
    },
  });
};
const createBookAPI = (
  thumbnail,
  slider,
  mainText,
  author,
  price,
  sold,
  quantity,
  category
) => {
  const URL_BACKEND = "/api/v1/book";
  const data = {
    thumbnail: thumbnail,
    slider: slider,
    mainText: mainText,
    author: author,
    price: price,
    sold: sold,
    quantity: quantity,
    category: category,
  };
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const deleteBookAPI = (id) => {
  const URL_BACKEND = `/api/v1/book/${id}`;
  const res = axios.delete(URL_BACKEND);
  return res;
};
const editBookAPI = (
  _id,
  thumbnail,
  slider,
  mainText,
  author,
  price,
  sold,
  quantity,
  category
) => {
  const URL_BACKEND = `/api/v1/book/${_id}`;
  const data = {
    thumbnail: thumbnail,
    slider: slider,
    mainText: mainText,
    author: author,
    price: price,
    sold: sold,
    quantity: quantity,
    category: category,
  };
  const res = axios.put(URL_BACKEND, data);
  return res;
};
const getBookAPI = (id) => {
  const URL_BACKEND = `/api/v1/book/${id}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callOrderAPI = (data) => {
  const URL_BACKEND = `/api/v1/order`;
  const res = axios.post(URL_BACKEND, data);
  return res;
};
const callOrderHistory = () => {
  const URL_BACKEND = `/api/v1/history`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callUpdateAvatar = (fileImg) => {
  const bodyFormData = new FormData();
  bodyFormData.append("fileImg", fileImg);
  return axios({
    method: "post",
    url: "/api/v1/file/upload",
    data: bodyFormData,
    headers: {
      "Content-Type": "multipart/form-data",
      "upload-type": "avatar",
    },
  });
};
const callUpdateUserInfo = (_id, phone, fullName, avatarUser) => {
  const URL_BACKEND = `/api/v1/user`;
  const data = {
    _id,
    phone,
    fullName,
    avatar: avatarUser,
  };
  const res = axios.put(URL_BACKEND, data);
  return res;
};
const callOnChangePassWord = (email, oldpass, newpass) => {
  const URL_BACKEND = `/api/v1/user/change-password`;
  const data = {
    email,
    oldpass,
    newpass,
  };
  const res = axios.post(URL_BACKEND, data);
  return res;
};

const callOrderApi = (query) => {
  const URL_BACKEND = `/api/v1/order?${query}`;
  const res = axios.get(URL_BACKEND);
  return res;
};
const callFetchDashBoard = () => {
  const URL_BACKEND = `/api/v1/database/dashboard`;
  const res = axios.get(URL_BACKEND);
  return res;
};
// === BIRTH CERTIFICATE API ===
const callListBirthCertificatesAPI = (query) => {
  const URL_BACKEND = `api/certificates/birth?${query}`;
  return axios.get(URL_BACKEND);
};

const createBirthCertificateAPI = (data) => {
  const URL_BACKEND = "/api/certificates/birth";
  return axios.post(URL_BACKEND, data);
};

// === DEATH CERTIFICATE API ===
const callListDeathCertificatesAPI = (query) => {
  const URL_BACKEND = `api/certificates/death?${query}`;
  return axios.get(URL_BACKEND);
};

const createDeathCertificateAPI = (data) => {
  const URL_BACKEND = "/api/certificates/death";
  return axios.post(URL_BACKEND, data);
};
export {
  loginUserAPI,
  callFetchAccount,
  callLogout,
  callListUserAPI,
  createUserAPI,
  callBulkCreateUser,
  deleteUserAPI,
  editUserAPI,
  callListBookAPI,
  callListCategoryAPI,
  callUploadBookImg,
  createBookAPI,
  deleteBookAPI,
  editBookAPI,
  getBookAPI,
  callOrderAPI,
  callOrderHistory,
  callUpdateAvatar,
  callUpdateUserInfo,
  callOnChangePassWord,
  callOrderApi,
  callFetchDashBoard,
  callUserById,
  callListCitizensAPI,
  deleteCitizenAPI,
  createCitizenAPI,
  callListHouseholdAPI,
  deleteHouseholdAPI,
  callListWardAPI,
  updateCitizenAPI,
  callHouseholdAPI,
  callHouseholdMembersdAPI,
  createHouseholdAPI,
  addHouseholdMemberAPI,
  deleteHouseholdMemberAPI,
  updateHouseholdAPI,
  callChangePassword,
  callListTemporaryResidencesAPI,
  callListTemporaryAbsencesAPI,
  createTemporaryResidencesAPI,
  createTemporaryAbsencesAPI,
  callListBirthCertificatesAPI,
  createBirthCertificateAPI,
  callListDeathCertificatesAPI,
  createDeathCertificateAPI,
};
