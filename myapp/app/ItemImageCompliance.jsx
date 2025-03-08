import { useSearchParams } from 'expo-router';
import ItemImageCompliancePage from './(tabs)/ItemImageCompliance';

export default function ItemImageCompliance() {
  const params = useSearchParams();
  
  const initialPhoto = params.photoUri && params.photoBase64 ? {
    uri: params.photoUri,
    base64: params.photoBase64
  } : null;

  return <ItemImageCompliancePage initialPhoto={initialPhoto} />;
}
