"""
Unit Test Suite for Issue #140
"""

import unittest
from solution import SolutionHandler

class TestSolutionHandler(unittest.TestCase):
    def setUp(self):
        self.handler = SolutionHandler()

    def test_execution_status(self):
        result = self.handler.execute()
        self.assertEqual(result.get("status"), "SUCCESS")
        self.assertEqual(result.get("issue"), 140)

if __name__ == "__main__":
    unittest.main()
