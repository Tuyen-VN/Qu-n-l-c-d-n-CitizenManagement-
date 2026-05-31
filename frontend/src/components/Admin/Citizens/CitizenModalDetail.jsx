import { Badge, Descriptions, Drawer } from "antd";
import moment from "moment";
const CitizenModalDetail = (props) => {
  const {
    citizenDetail,
    setCitizenDetail,
    isDetailCitizenOpen,
    setIsDetailCitizenOpen,
  } = props;
  return (
    <>
      <Drawer
        title="Chức năng xem chi tiết"
        closable={{ "aria-label": "Close Button" }}
        onClose={() => {
          setCitizenDetail(null);
          setIsDetailCitizenOpen(false);
        }}
        open={isDetailCitizenOpen}
        width="50vw"
      >
        <Descriptions title="Thông tin người dùng" column={2} bordered>
          <Descriptions.Item label="Mã công dân">
            {citizenDetail?.citizen_code}
          </Descriptions.Item>
          <Descriptions.Item label="Họ và tên">
            {citizenDetail?.full_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {citizenDetail?.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {citizenDetail?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Tuổi">
            {citizenDetail?.age}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">
            {moment(citizenDetail?.date_of_birth).format(`DD/MM/YYYY`)}
          </Descriptions.Item>
          <Descriptions.Item label="Giới tính">
            {citizenDetail?.gender}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>
            {citizenDetail?.permanent_address}
          </Descriptions.Item>

          {/* <Descriptions.Item label="Create At">
            {moment(citizenDetail?.createAt).format(`DD-MM-YYYY hh:mm:ss`)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày Update">
            {moment(citizenDetail?.updateAt).format(`DD-MM-YYYY hh:mm:ss`)}
          </Descriptions.Item> */}
        </Descriptions>
      </Drawer>
    </>
  );
};
export default CitizenModalDetail;
