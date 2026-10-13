import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PropertyRecord } from '../types';
import { PROPERTIES_DATA } from '../data/estateData';

interface PropertiesContextType {
  properties: PropertyRecord[];
  setProperties: React.Dispatch<React.SetStateAction<PropertyRecord[]>>;
  addProperty: (property: PropertyRecord) => void;
  approveProperty: (propertyId: string, approvedBy: string, role: string, note?: string) => void;
  rejectProperty: (propertyId: string, rejectedBy: string, role: string, reason: string) => void;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PropertiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<PropertyRecord[]>(PROPERTIES_DATA);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(PROPERTIES_DATA[0]?.id || null);

  const addProperty = (newProp: PropertyRecord) => {
    setProperties((prev) => [newProp, ...prev]);
  };

  const approveProperty = (propertyId: string, approvedBy: string, role: string, note?: string) => {
    const certHash = `CERT-HMAC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          return {
            ...p,
            verificationStatus: 'APPROVED' as const,
            status: 'Healthy' as const,
            approvalDetails: {
              approvedBy,
              approvedByRole: role as any,
              approvedAt: timestamp,
              approvalNote: note || 'Approved with full verified title deed and identity certificate.',
              certificateHash: certHash,
            },
          };
        }
        return p;
      })
    );
  };

  const rejectProperty = (propertyId: string, rejectedBy: string, role: string, reason: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          return {
            ...p,
            verificationStatus: 'REJECTED' as const,
            status: 'Action needed' as const,
            approvalDetails: {
              approvedBy: rejectedBy,
              approvedByRole: role as any,
              approvedAt: timestamp,
              approvalNote: `Rejected: ${reason}`,
            },
          };
        }
        return p;
      })
    );
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        setProperties,
        addProperty,
        approveProperty,
        rejectProperty,
        selectedPropertyId,
        setSelectedPropertyId,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
};
