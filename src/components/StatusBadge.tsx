interface StatusBadgeProps {
  status: string;
  type?: 'finance' | 'drop' | 'role' | 'paid';
}

export function StatusBadge({ status, type = 'finance' }: StatusBadgeProps) {
  let classes = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  let label = status;
  
  switch (type) {
    case 'finance':
      switch (status) {
        case 'WAIT':
          classes += ' bg-yellow-100 text-yellow-800 border border-yellow-200';
          label = 'รอจ่าย';
          break;
        case 'PAID':
          classes += ' bg-green-100 text-green-800 border border-green-200';
          label = 'จ่ายแล้ว';
          break;
        case 'PERSONAL':
          classes += ' bg-purple-100 text-purple-800 border border-purple-200';
          label = 'เก็บเอง';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
      break;
      
    case 'drop':
      switch (status) {
        case 'DROPPED':
          classes += ' bg-green-100 text-green-800 border border-green-200';
          label = 'ดรอปแล้ว';
          break;
        case 'NOT_DROPPED':
          classes += ' bg-gray-100 text-gray-600 border border-gray-200';
          label = 'ไม่ดรอป';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
      break;
      
    case 'role':
      switch (status) {
        case 'ADMIN':
          classes += ' bg-pink-100 text-pink-800 border border-pink-200';
          label = 'Admin';
          break;
        case 'MEMBER':
          classes += ' bg-blue-100 text-blue-800 border border-blue-200';
          label = 'Member';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
      break;
      
    case 'paid':
      switch (status) {
        case 'WAIT':
          classes += ' bg-yellow-100 text-yellow-800 border border-yellow-200';
          label = 'รอรับเงิน';
          break;
        case 'PAID':
          classes += ' bg-green-100 text-green-800 border border-green-200';
          label = 'ได้รับแล้ว';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
      break;
  }
  
  return <span className={classes}>{label}</span>;
}
