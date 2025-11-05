// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Space, Modal, Input, message, Select } from "antd";
import { EyeOutlined, MailOutlined, DownloadOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { supabase } from "@/integrations/supabase/client";
import { docsAPI } from "./api";

export default function DocumentDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [emailForm] = React.useState({ to: "", subject: "Crave'n Executive Document", message: "" });
  const [isCEO, setIsCEO] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
    checkIfCEO();
  }, []);

  const checkIfCEO = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsCEO(false);
        return;
      }

      const { data: execUser, error } = await supabase
        .from("exec_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !execUser) {
        setIsCEO(false);
        return;
      }

      setIsCEO(execUser.role === "ceo");
    } catch (err) {
      console.error("Error checking CEO status:", err);
      setIsCEO(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("executive_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      message.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (doc: any) => {
    setSelectedDoc(doc);
    setEmailModalVisible(true);
  };

  const sendEmail = async () => {
    if (!selectedDoc || !emailForm.to) {
      message.warning("Please enter recipient email");
      return;
    }

    try {
      await docsAPI.post("/documents/email", {
        document_id: selectedDoc.id,
        to: emailForm.to,
        subject: emailForm.subject,
        message_html: emailForm.message || "Your document is attached and/or available via the portal.",
      });
      message.success("Email sent");
      setEmailModalVisible(false);
      setSelectedDoc(null);
      emailForm.to = "";
      emailForm.subject = "Crave'n Executive Document";
      emailForm.message = "";
    } catch (e: any) {
      message.error(e?.error || e?.message || "Failed to send email");
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      // Delete all documents from executive_documents table
      // Use a condition that matches all rows (created_at is never null)
      const { error } = await supabase
        .from("executive_documents")
        .delete()
        .not("created_at", "is", null);

      if (error) throw error;

      message.success(`Successfully deleted all ${documents.length} documents`);
      await fetchDocuments(); // Refresh the list
    } catch (err: any) {
      console.error("Error deleting all documents:", err);
      message.error(err?.message || "Failed to delete all documents");
    } finally {
      setDeleting(false);
    }
  };

  const showDeleteAllConfirm = () => {
    Modal.confirm({
      title: "Delete All Documents?",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to permanently delete all ${documents.length} documents? This action cannot be undone.`,
      okText: "Yes, Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: handleDeleteAll,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "green";
      case "generated":
        return "blue";
      case "sent":
        return "orange";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => (
        <span style={{ textTransform: "capitalize" }}>{text.replace(/_/g, " ")}</span>
      ),
    },
    {
      title: "Officer",
      dataIndex: "officer_name",
      key: "officer_name",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          {record.file_url && (
            <Button
              icon={<EyeOutlined />}
              size="small"
              href={record.file_url}
              target="_blank"
              rel="noreferrer"
            >
              View
            </Button>
          )}
          {record.signed_file_url && (
            <Button
              icon={<DownloadOutlined />}
              size="small"
              href={record.signed_file_url}
              target="_blank"
              rel="noreferrer"
            >
              Signed PDF
            </Button>
          )}
          <Button icon={<MailOutlined />} size="small" onClick={() => handleEmail(record)}>
            Email
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Document Library {documents.length > 0 && `(${documents.length} documents)`}</h3>
        <Space>
          {isCEO && (
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={showDeleteAllConfirm}
              loading={deleting}
              disabled={documents.length === 0}
            >
              Delete All Documents
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchDocuments} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>
      <Table
        dataSource={documents}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Send Document via Email"
        open={emailModalVisible}
        onOk={sendEmail}
        onCancel={() => {
          setEmailModalVisible(false);
          setSelectedDoc(null);
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label>To:</label>
          <Input
            value={emailForm.to}
            onChange={(e) => (emailForm.to = e.target.value)}
            placeholder="recipient@example.com"
            style={{ marginTop: 8 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Subject:</label>
          <Input
            value={emailForm.subject}
            onChange={(e) => (emailForm.subject = e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <label>Message:</label>
          <Input.TextArea
            value={emailForm.message}
            onChange={(e) => (emailForm.message = e.target.value)}
            rows={4}
            placeholder="Your document is attached and/or available via the portal."
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </>
  );
}

