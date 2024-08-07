import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Tooltip from "@mui/material/Tooltip";
import api from "../api";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import Link from "@mui/material/Link";
import { max } from "moment";

const columns = [
  { id: "title", label: "Title", minWidth: 200 },
  { id: "link", label: "Link", maxWidth: 50 },
  { id: "type", label: "Type", minWidth: 100 },
  { id: "status", label: "Status", minWidth: 100 },
  {
    id: "lastModified",
    label: "Last Modified",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "coverLetter",
    label: "Cover Letter",
    minWidth: 130,
    align: "center",
  },
  {
    id: "action",
    label: "Resume",
    minWidth: 100,
    align: "center",
  },
];

function createData(id, title, link, type, status, lastModified) {
  return { id, title, link, type, status, lastModified };
}

export default function TableProjects({ dataProject }) {
  const navigate = useNavigate();
  const [severity, setSeverity] = React.useState("success");
  const [message, setMessage] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const rows = dataProject.map((data) => {
    return createData(data.id, data.title, data.link, data.type, data.status, data.updatedAt);
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleEdit = (id) => {
    navigate(`/project/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`http://localhost:8080/projects/${id}`);
      if (res.status === 204) {
        setMessage("Delete project successfully!");
        setSeverity("success");
        window.location.reload();
      }
    } catch (error) {
      setMessage(error.message);
      setSeverity("error");
    }
    setOpen(true);
  };

  const handleRowClick = (id) => {
    console.log(id);
    navigate(`/job/${id}`);
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, maxWidth: column.maxWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow 
                    hover 
                    role="checkbox" 
                    tabIndex={-1} 
                    key={row.id}
                    onClick={() => handleRowClick(row.id)}
                    style={{ cursor: 'pointer' }} 
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.id === "action" ? (
                            <>
                              <Tooltip title="View/Edit">
                                <Button
                                  onClick={() => handleEdit(row.id)}
                                  color="primary"
                                >
                                  <VisibilityIcon />
                                </Button>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <Button
                                  onClick={() => handleDelete(row.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </Button>
                              </Tooltip>
                            </>
                          ) : column.id === "coverLetter" ? (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cover-letter/${row.id}`);
                              }}
                            >
                              Cover Letter
                            </Button>
                          ): column.id === "link" ? (
                            <Link href={value} target="_blank" rel="noopener noreferrer" style={{width: "80px"}}>
                              {value}
                            </Link>
                          ) : column.format && typeof value === "number" ? (
                            column.format(value)
                          ) : (
                            value
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
